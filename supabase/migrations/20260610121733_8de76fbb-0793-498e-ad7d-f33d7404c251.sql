
-- 1) Cities of Saudi Arabia
CREATE TABLE IF NOT EXISTS public.sa_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  region text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_km double precision NOT NULL DEFAULT 30,
  telegram_group_chat_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sa_cities TO authenticated;
GRANT ALL ON public.sa_cities TO service_role;
ALTER TABLE public.sa_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage cities" ON public.sa_cities
  TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_sa_cities_updated BEFORE UPDATE ON public.sa_cities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Add city_id to driver_locations & rides
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.sa_cities(id) ON DELETE SET NULL;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_city_id uuid REFERENCES public.sa_cities(id) ON DELETE SET NULL;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dropoff_city_id uuid REFERENCES public.sa_cities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_driver_locations_city ON public.driver_locations(city_id);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_city ON public.rides(pickup_city_id);

-- 3) Helper: closest city for a given point (only if within radius)
CREATE OR REPLACE FUNCTION public.city_for_point(_lat double precision, _lng double precision)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.sa_cities
  WHERE active = true
    AND (6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(_lat))*cos(radians(lat))*cos(radians(lng)-radians(_lng))
        + sin(radians(_lat))*sin(radians(lat))
      ))
    )) <= radius_km
  ORDER BY (6371 * acos(
    LEAST(1.0, GREATEST(-1.0,
      cos(radians(_lat))*cos(radians(lat))*cos(radians(lng)-radians(_lng))
      + sin(radians(_lat))*sin(radians(lat))
    ))
  )) ASC
  LIMIT 1;
$$;

-- 4) Triggers to auto-assign city
CREATE OR REPLACE FUNCTION public.set_driver_location_city()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.city_id := public.city_for_point(NEW.latitude, NEW.longitude);
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS trg_driver_loc_city ON public.driver_locations;
CREATE TRIGGER trg_driver_loc_city BEFORE INSERT OR UPDATE OF latitude, longitude
  ON public.driver_locations FOR EACH ROW EXECUTE FUNCTION public.set_driver_location_city();

CREATE OR REPLACE FUNCTION public.set_ride_cities()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.pickup_city_id := public.city_for_point(NEW.pickup_lat, NEW.pickup_lng);
  NEW.dropoff_city_id := public.city_for_point(NEW.drop_lat, NEW.drop_lng);
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS trg_rides_cities ON public.rides;
CREATE TRIGGER trg_rides_cities BEFORE INSERT
  ON public.rides FOR EACH ROW EXECUTE FUNCTION public.set_ride_cities();

-- 5) Rewrite nearby_drivers to require city match
DROP FUNCTION IF EXISTS public.nearby_drivers(double precision,double precision,double precision,gender_pref,integer,boolean);
CREATE OR REPLACE FUNCTION public.nearby_drivers(
  _lat double precision,
  _lng double precision,
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
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(_lat)) * cos(radians(dl.latitude)) *
          cos(radians(dl.longitude) - radians(_lng)) +
          sin(radians(_lat)) * sin(radians(dl.latitude))
        ))
      )) AS distance_km,
      d.rating_avg
    FROM public.drivers d
    JOIN public.driver_locations dl ON dl.driver_id = d.id
    WHERE d.status = 'available'
      AND d.registration_complete = true
      AND COALESCE(d.flagged, false) = false
      AND (NOT _require_subscription OR d.subscription_status = 'active')
      AND (_gender_pref = 'any' OR d.gender::text = _gender_pref::text)
      AND (_city_id IS NULL OR dl.city_id = _city_id)
      AND dl.updated_at > now() - interval '5 minutes'
  ) sub
  WHERE sub.distance_km <= _radius_km
  ORDER BY sub.distance_km ASC, sub.rating_avg DESC
  LIMIT _limit;
$$;

-- 6) Seed major Saudi cities (radius covers metropolitan area + districts)
INSERT INTO public.sa_cities (name_ar, name_en, region, lat, lng, radius_km) VALUES
  ('الرياض','Riyadh','الرياض',24.7136,46.6753,60),
  ('الدرعية','Diriyah','الرياض',24.7370,46.5750,15),
  ('الخرج','Al Kharj','الرياض',24.1556,47.3120,25),
  ('جدة','Jeddah','مكة المكرمة',21.4858,39.1925,50),
  ('مكة المكرمة','Makkah','مكة المكرمة',21.3891,39.8579,30),
  ('الطائف','Taif','مكة المكرمة',21.2854,40.4183,30),
  ('رابغ','Rabigh','مكة المكرمة',22.7986,39.0349,20),
  ('المدينة المنورة','Madinah','المدينة المنورة',24.5247,39.5692,35),
  ('ينبع','Yanbu','المدينة المنورة',24.0894,38.0618,25),
  ('الدمام','Dammam','الشرقية',26.4207,50.0888,30),
  ('الخبر','Khobar','الشرقية',26.2172,50.1971,20),
  ('الظهران','Dhahran','الشرقية',26.2361,50.0393,15),
  ('القطيف','Qatif','الشرقية',26.5650,49.9961,20),
  ('الجبيل','Jubail','الشرقية',27.0046,49.6458,25),
  ('الأحساء','Al-Ahsa','الشرقية',25.3833,49.5833,40),
  ('حفر الباطن','Hafar Al-Batin','الشرقية',28.4337,45.9700,25),
  ('أبها','Abha','عسير',18.2164,42.5053,20),
  ('خميس مشيط','Khamis Mushait','عسير',18.3000,42.7300,25),
  ('بيشة','Bisha','عسير',20.0000,42.6000,20),
  ('جازان','Jazan','جازان',16.8892,42.5511,20),
  ('صبيا','Sabya','جازان',17.1492,42.6258,15),
  ('نجران','Najran','نجران',17.4923,44.1277,25),
  ('تبوك','Tabuk','تبوك',28.3838,36.5550,30),
  ('حائل','Hail','حائل',27.5219,41.6907,25),
  ('بريدة','Buraidah','القصيم',26.3260,43.9750,25),
  ('عنيزة','Unaizah','القصيم',26.0844,43.9936,20),
  ('الرس','Ar Rass','القصيم',25.8718,43.5040,15),
  ('الباحة','Al Baha','الباحة',20.0129,41.4677,20),
  ('عرعر','Arar','الحدود الشمالية',30.9753,41.0381,25),
  ('سكاكا','Sakaka','الجوف',29.9697,40.2064,20),
  ('القريات','Qurayyat','الجوف',31.3320,37.3429,15);

-- 7) Suspicious accounts review log
CREATE TABLE IF NOT EXISTS public.suspicious_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_role text NOT NULL CHECK (subject_role IN ('driver','rider')),
  subject_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('flagged','unflagged','noted','banned')),
  reason text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_susp_subject ON public.suspicious_reviews(subject_role, subject_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suspicious_reviews TO authenticated;
GRANT ALL ON public.suspicious_reviews TO service_role;
ALTER TABLE public.suspicious_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage suspicious" ON public.suspicious_reviews
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

-- 8) Default flag thresholds in app_config
INSERT INTO public.app_config (key, value) VALUES
  ('flag_thresholds', jsonb_build_object(
    'min_rating', 2.5,
    'max_cancel_rate', 0.35,
    'min_rides_for_eval', 5,
    'ai_flag_on_any_flag', true
  ))
ON CONFLICT (key) DO NOTHING;

-- 9) Backfill cities for existing data
UPDATE public.driver_locations SET city_id = public.city_for_point(latitude, longitude) WHERE city_id IS NULL;
UPDATE public.rides SET pickup_city_id = public.city_for_point(pickup_lat, pickup_lng),
                        dropoff_city_id = public.city_for_point(drop_lat, drop_lng)
WHERE pickup_city_id IS NULL;
