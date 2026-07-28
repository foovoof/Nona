
-- 1) Languages + nationality + KYC states for drivers
DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('pending','under_review','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS kyc_reject_reason text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selfie_photo_url text;

ALTER TABLE public.riders
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS language_selected boolean NOT NULL DEFAULT false;

-- 2) Ride completion confirmations (both sides)
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS rider_confirmed_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_confirmed_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS passenger_onboard_at timestamptz;

-- 3) Per-message translation cache (per-ride chat already isolated by ride_id)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS original_lang text,
  ADD COLUMN IF NOT EXISTS translated_text text,
  ADD COLUMN IF NOT EXISTS translated_lang text;

-- 4) Phone OTP verification (via Telegram bot)
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  role text NOT NULL CHECK (role IN ('driver','rider')),
  phone text NOT NULL,
  code text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_lookup
  ON public.phone_verifications (telegram_id, role, verified);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_verifications TO authenticated;
GRANT ALL ON public.phone_verifications TO service_role;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_full_access_phone_verifications" ON public.phone_verifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Helper: only approved + active drivers can be dispatched
CREATE OR REPLACE FUNCTION public.nearby_drivers(
  _lat double precision, _lng double precision,
  _radius_km double precision DEFAULT 15,
  _gender_pref gender_pref DEFAULT 'any',
  _limit integer DEFAULT 10,
  _require_subscription boolean DEFAULT true,
  _city_id uuid DEFAULT NULL
)
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
      AND d.kyc_status = 'approved'
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
