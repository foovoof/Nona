-- =====================================================================
-- Guarded ride state machine + idempotent AI evaluation
-- =====================================================================

ALTER TABLE public.rides   ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.rides   ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.riders  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.riders  ADD COLUMN IF NOT EXISTS total_cancellations integer NOT NULL DEFAULT 0;

-- 1) Allowed transitions ----------------------------------------------
CREATE OR REPLACE FUNCTION public.is_valid_ride_transition(_from public.ride_status, _to public.ride_status)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _from
    WHEN 'searching'   THEN _to IN ('assigned','cancelled','failed')
    WHEN 'assigned'    THEN _to IN ('accepted','searching','cancelled','failed')
    WHEN 'accepted'    THEN _to IN ('in_progress','cancelled','failed')
    WHEN 'in_progress' THEN _to IN ('completed','cancelled','failed')
    ELSE false
  END;
$$;

-- 2) Atomic, guarded, audited transition ------------------------------
-- Optimistic locking: pass _expected_version (NULL skips the check).
CREATE OR REPLACE FUNCTION public.transition_ride(
  _ride_id uuid,
  _to_status public.ride_status,
  _actor_role text DEFAULT 'system',
  _actor_id text DEFAULT NULL,
  _reason text DEFAULT NULL,
  _expected_version integer DEFAULT NULL
)
RETURNS TABLE(ok boolean, status text, ride_status public.ride_status, driver_id uuid, rider_id uuid, version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ride public.rides;
  _now timestamptz := now();
BEGIN
  SELECT * INTO _ride FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF _ride IS NULL THEN
    RETURN QUERY SELECT false, 'not_found'::text, NULL::public.ride_status, NULL::uuid, NULL::uuid, NULL::integer;
    RETURN;
  END IF;

  IF _expected_version IS NOT NULL AND _ride.version <> _expected_version THEN
    RETURN QUERY SELECT false, 'version_conflict'::text, _ride.status, _ride.driver_id, _ride.rider_id, _ride.version;
    RETURN;
  END IF;

  IF _ride.status = _to_status THEN
    -- idempotent no-op
    RETURN QUERY SELECT true, 'noop'::text, _ride.status, _ride.driver_id, _ride.rider_id, _ride.version;
    RETURN;
  END IF;

  IF NOT public.is_valid_ride_transition(_ride.status, _to_status) THEN
    RETURN QUERY SELECT false, 'invalid_transition'::text, _ride.status, _ride.driver_id, _ride.rider_id, _ride.version;
    RETURN;
  END IF;

  UPDATE public.rides SET
    status        = _to_status,
    version       = _ride.version + 1,
    accepted_at   = CASE WHEN _to_status = 'accepted'    THEN COALESCE(accepted_at, _now)  ELSE accepted_at END,
    started_at    = CASE WHEN _to_status = 'in_progress' THEN COALESCE(started_at, _now)   ELSE started_at END,
    completed_at  = CASE WHEN _to_status = 'completed'   THEN COALESCE(completed_at, _now) ELSE completed_at END,
    cancelled_at  = CASE WHEN _to_status = 'cancelled'   THEN COALESCE(cancelled_at, _now) ELSE cancelled_at END,
    cancelled_by  = CASE WHEN _to_status = 'cancelled'   THEN COALESCE(cancelled_by, _actor_role) ELSE cancelled_by END,
    cancel_reason = CASE WHEN _to_status = 'cancelled'   THEN COALESCE(_reason, cancel_reason) ELSE cancel_reason END
  WHERE id = _ride_id
  RETURNING * INTO _ride;

  -- Side effects that must be part of the same transaction
  IF _to_status IN ('cancelled','failed','completed') THEN
    UPDATE public.ride_offers
       SET status = 'cancelled', responded_at = COALESCE(responded_at, _now)
     WHERE ride_id = _ride_id AND status = 'pending';

    IF _ride.driver_id IS NOT NULL THEN
      UPDATE public.drivers SET status = 'available', version = version + 1
       WHERE id = _ride.driver_id AND status <> 'offline';
    END IF;
  END IF;

  IF _to_status = 'cancelled' THEN
    IF _actor_role = 'driver' AND _ride.driver_id IS NOT NULL THEN
      UPDATE public.drivers SET total_cancellations = total_cancellations + 1, version = version + 1
       WHERE id = _ride.driver_id;
    ELSIF _actor_role = 'rider' THEN
      UPDATE public.riders SET total_cancellations = total_cancellations + 1, version = version + 1
       WHERE id = _ride.rider_id;
    END IF;
  END IF;

  INSERT INTO public.audit_log(actor_type, actor_id, action, entity_type, entity_id, metadata)
  VALUES (_actor_role, _actor_id, 'ride.' || _to_status::text, 'ride', _ride_id::text,
          jsonb_build_object('reason', _reason, 'version', _ride.version, 'driver_id', _ride.driver_id));

  RETURN QUERY SELECT true, 'ok'::text, _ride.status, _ride.driver_id, _ride.rider_id, _ride.version;
END;
$$;
REVOKE ALL ON FUNCTION public.transition_ride(uuid, public.ride_status, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_ride(uuid, public.ride_status, text, text, text, integer) TO service_role;

-- 3) Idempotent AI evaluation -----------------------------------------
CREATE TABLE IF NOT EXISTS public.ride_evaluations (
  ride_id uuid PRIMARY KEY REFERENCES public.rides(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  driver_rating numeric(3,2),
  rider_rating numeric(3,2),
  flags jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT SELECT ON public.ride_evaluations TO authenticated;
GRANT ALL ON public.ride_evaluations TO service_role;
ALTER TABLE public.ride_evaluations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "admins read ride evaluations" ON public.ride_evaluations
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Claim: returns true only for the first caller per ride (stale claims recyclable).
CREATE OR REPLACE FUNCTION public.claim_ride_evaluation(_ride_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _updated integer;
BEGIN
  INSERT INTO public.ride_evaluations(ride_id) VALUES (_ride_id);
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  -- Recycle a claim that never completed within 15 minutes (crashed worker).
  UPDATE public.ride_evaluations
     SET claimed_at = now()
   WHERE ride_id = _ride_id AND applied_at IS NULL AND claimed_at < now() - interval '15 minutes';
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_ride_evaluation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ride_evaluation(uuid) TO service_role;

-- Apply: folds ratings into rolling averages exactly once, with optimistic locking.
CREATE OR REPLACE FUNCTION public.apply_ride_evaluation(
  _ride_id uuid,
  _driver_rating numeric,
  _rider_rating numeric,
  _flags jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(ok boolean, status text, driver_total integer, driver_avg numeric, rider_total integer, rider_avg numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ride public.rides;
  _eval public.ride_evaluations;
  _d public.drivers;
  _r public.riders;
  _d_total integer := 0; _d_avg numeric := 0;
  _r_total integer := 0; _r_avg numeric := 0;
BEGIN
  SELECT * INTO _eval FROM public.ride_evaluations WHERE ride_id = _ride_id FOR UPDATE;
  IF _eval IS NULL THEN
    RETURN QUERY SELECT false, 'not_claimed'::text, 0, 0::numeric, 0, 0::numeric; RETURN;
  END IF;
  IF _eval.applied_at IS NOT NULL THEN
    RETURN QUERY SELECT true, 'already_applied'::text, 0, 0::numeric, 0, 0::numeric; RETURN;
  END IF;

  SELECT * INTO _ride FROM public.rides WHERE id = _ride_id;
  IF _ride IS NULL OR _ride.status <> 'completed' THEN
    RETURN QUERY SELECT false, 'ride_not_completed'::text, 0, 0::numeric, 0, 0::numeric; RETURN;
  END IF;

  IF _ride.driver_id IS NOT NULL THEN
    SELECT * INTO _d FROM public.drivers WHERE id = _ride.driver_id FOR UPDATE;
    _d_total := _d.total_rides + 1;
    _d_avg := round(((_d.rating_avg * _d.total_rides) + _driver_rating) / _d_total, 2);
    UPDATE public.drivers
       SET total_rides = _d_total, rating_avg = _d_avg, version = version + 1
     WHERE id = _d.id AND version = _d.version;
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'driver_version_conflict'::text, 0, 0::numeric, 0, 0::numeric; RETURN;
    END IF;
  END IF;

  SELECT * INTO _r FROM public.riders WHERE id = _ride.rider_id FOR UPDATE;
  IF _r IS NOT NULL THEN
    _r_total := _r.total_rides + 1;
    _r_avg := round(((_r.rating_avg * _r.total_rides) + _rider_rating) / _r_total, 2);
    UPDATE public.riders
       SET total_rides = _r_total, rating_avg = _r_avg, version = version + 1
     WHERE id = _r.id AND version = _r.version;
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'rider_version_conflict'::text, 0, 0::numeric, 0, 0::numeric; RETURN;
    END IF;
  END IF;

  UPDATE public.ride_evaluations
     SET applied_at = now(), driver_rating = _driver_rating, rider_rating = _rider_rating, flags = _flags
   WHERE ride_id = _ride_id;

  INSERT INTO public.audit_log(actor_type, actor_id, action, entity_type, entity_id, metadata)
  VALUES ('system', 'ai-evaluator', 'ride.evaluated', 'ride', _ride_id::text,
          jsonb_build_object('driver_rating', _driver_rating, 'rider_rating', _rider_rating, 'flags', _flags));

  RETURN QUERY SELECT true, 'applied'::text, _d_total, _d_avg, _r_total, _r_avg;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_ride_evaluation(uuid, numeric, numeric, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_ride_evaluation(uuid, numeric, numeric, jsonb) TO service_role;

-- Release a claim when the evaluation could not be produced (AI failure).
CREATE OR REPLACE FUNCTION public.release_ride_evaluation(_ride_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.ride_evaluations WHERE ride_id = _ride_id AND applied_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.release_ride_evaluation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_ride_evaluation(uuid) TO service_role;
