
-- Claim admin: first user with no admins yet, OR any caller if there are no admins, becomes admin.
CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid; _count int;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT COUNT(*) INTO _count FROM public.user_roles WHERE role = 'admin';
  IF _count > 0 THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;

-- Add suspended/deleted-style status; default keeps existing rows untouched.
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.riders  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- Broadcasts log
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('drivers','riders','both')),
  city_id uuid REFERENCES public.sa_cities(id),
  message text NOT NULL,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read broadcasts" ON public.broadcasts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write broadcasts" ON public.broadcasts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update nearby_drivers to exclude suspended
CREATE OR REPLACE FUNCTION public.nearby_drivers(_lat double precision, _lng double precision, _radius_km double precision DEFAULT 15, _gender_pref gender_pref DEFAULT 'any'::gender_pref, _limit integer DEFAULT 10, _require_subscription boolean DEFAULT true, _city_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(driver_id uuid, telegram_id bigint, distance_km double precision, rating_avg numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (
    SELECT d.id AS driver_id, d.telegram_id,
      (6371 * acos(LEAST(1.0, GREATEST(-1.0,
        cos(radians(_lat)) * cos(radians(dl.latitude)) *
        cos(radians(dl.longitude) - radians(_lng)) +
        sin(radians(_lat)) * sin(radians(dl.latitude))
      )))) AS distance_km,
      d.rating_avg
    FROM public.drivers d
    JOIN public.driver_locations dl ON dl.driver_id = d.id
    WHERE d.status = 'available'
      AND d.registration_complete = true
      AND COALESCE(d.flagged, false) = false
      AND COALESCE(d.suspended, false) = false
      AND (NOT _require_subscription OR d.subscription_status = 'active')
      AND (_gender_pref = 'any' OR d.gender::text = _gender_pref::text)
      AND (_city_id IS NULL OR dl.city_id = _city_id)
      AND dl.updated_at > now() - interval '5 minutes'
  ) sub
  WHERE sub.distance_km <= _radius_km
  ORDER BY sub.distance_km ASC, sub.rating_avg DESC
  LIMIT _limit;
$$;
