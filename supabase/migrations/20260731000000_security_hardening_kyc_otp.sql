-- =====================================================================
-- Security hardening + KYC/OTP foundation
-- =====================================================================

-- 1) Generic atomic rate limiting -------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  bucket text NOT NULL,
  subject text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, subject, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_counters (window_start);

GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "admins read rate limits" ON public.rate_limit_counters
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _bucket text,
  _subject text,
  _limit integer,
  _window_seconds integer
)
RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _win timestamptz;
  _count integer;
BEGIN
  _win := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.rate_limit_counters(bucket, subject, window_start, count)
  VALUES (_bucket, _subject, _win, 1)
  ON CONFLICT (bucket, subject, window_start)
  DO UPDATE SET count = public.rate_limit_counters.count + 1, updated_at = now()
  RETURNING count INTO _count;

  DELETE FROM public.rate_limit_counters
   WHERE window_start < now() - interval '1 day';

  RETURN QUERY SELECT (_count <= _limit), GREATEST(_limit - _count, 0), _win + make_interval(secs => _window_seconds);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;

-- 2) Telegram webhook replay protection -------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_processed_updates (
  bot_role text NOT NULL CHECK (bot_role IN ('driver','rider')),
  update_id bigint NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bot_role, update_id)
);
CREATE INDEX IF NOT EXISTS idx_tg_updates_processed_at ON public.telegram_processed_updates (processed_at);
GRANT ALL ON public.telegram_processed_updates TO service_role;
ALTER TABLE public.telegram_processed_updates ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_telegram_update(_bot_role text, _update_id bigint)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.telegram_processed_updates(bot_role, update_id) VALUES (_bot_role, _update_id);
  DELETE FROM public.telegram_processed_updates WHERE processed_at < now() - interval '2 days';
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_telegram_update(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_telegram_update(text, bigint) TO service_role;

-- 3) Append-only audit log --------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL,
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log (action, occurred_at DESC);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "admins read audit" ON public.audit_log
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;
DROP TRIGGER IF EXISTS trg_audit_log_immutable ON public.audit_log;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- 4) Hardened OTP challenges (encrypted phone + blind index) ----------
CREATE TABLE IF NOT EXISTS public.otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  role text NOT NULL CHECK (role IN ('driver','rider')),
  phone_ciphertext text NOT NULL,
  phone_blind_index text NOT NULL,
  code_hash text NOT NULL,
  channel text NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms','whatsapp','telegram')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  resend_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_lookup ON public.otp_challenges (telegram_id, role, consumed_at, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_blind ON public.otp_challenges (phone_blind_index);

GRANT ALL ON public.otp_challenges TO service_role;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "admins read otp meta" ON public.otp_challenges
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Atomic OTP consumption: increments attempts and marks consumed in one statement.
CREATE OR REPLACE FUNCTION public.consume_otp_challenge(_challenge_id uuid, _code_hash text)
RETURNS TABLE(status text, attempts_left integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row public.otp_challenges;
BEGIN
  SELECT * INTO _row FROM public.otp_challenges WHERE id = _challenge_id FOR UPDATE;
  IF _row IS NULL THEN RETURN QUERY SELECT 'not_found'::text, 0; RETURN; END IF;
  IF _row.consumed_at IS NOT NULL THEN RETURN QUERY SELECT 'already_used'::text, 0; RETURN; END IF;
  IF _row.expires_at < now() THEN RETURN QUERY SELECT 'expired'::text, 0; RETURN; END IF;
  IF _row.attempts >= _row.max_attempts THEN RETURN QUERY SELECT 'too_many_attempts'::text, 0; RETURN; END IF;

  UPDATE public.otp_challenges SET attempts = attempts + 1 WHERE id = _challenge_id
  RETURNING * INTO _row;

  IF _row.code_hash = _code_hash THEN
    UPDATE public.otp_challenges SET consumed_at = now() WHERE id = _challenge_id;
    RETURN QUERY SELECT 'verified'::text, GREATEST(_row.max_attempts - _row.attempts, 0);
  ELSE
    RETURN QUERY SELECT 'invalid_code'::text, GREATEST(_row.max_attempts - _row.attempts, 0);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_otp_challenge(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_otp_challenge(uuid, text) TO service_role;

-- 5) KYC domain --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyc_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  face_match_score numeric(4,3),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  reject_reason text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_app_driver ON public.kyc_applications (driver_id);

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.kyc_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('national_id','driving_license','vehicle_registration','selfie','insurance')),
  storage_path text NOT NULL,
  checksum text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_app ON public.kyc_documents (application_id);

GRANT SELECT ON public.kyc_applications TO authenticated;
GRANT ALL ON public.kyc_applications TO service_role;
GRANT SELECT ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;
ALTER TABLE public.kyc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "staff read kyc apps" ON public.kyc_applications
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "staff read kyc docs" ON public.kyc_documents
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_kyc_apps_updated ON public.kyc_applications;
CREATE TRIGGER trg_kyc_apps_updated BEFORE UPDATE ON public.kyc_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) Encrypted phone storage on drivers/riders -------------------------
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS phone_ciphertext text,
  ADD COLUMN IF NOT EXISTS phone_blind_index text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
ALTER TABLE public.riders
  ADD COLUMN IF NOT EXISTS phone_ciphertext text,
  ADD COLUMN IF NOT EXISTS phone_blind_index text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_drivers_phone_bi ON public.drivers (phone_blind_index);
CREATE INDEX IF NOT EXISTS idx_riders_phone_bi ON public.riders (phone_blind_index);
