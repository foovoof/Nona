
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS pickup_address_resolved text,
  ADD COLUMN IF NOT EXISTS drop_address_resolved text,
  ADD COLUMN IF NOT EXISTS route_distance_km numeric(8,2),
  ADD COLUMN IF NOT EXISTS route_duration_min numeric(6,1),
  ADD COLUMN IF NOT EXISTS traffic_duration_min numeric(6,1),
  ADD COLUMN IF NOT EXISTS suggested_fare numeric(8,2),
  ADD COLUMN IF NOT EXISTS surge_multiplier numeric(3,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS weather_condition text,
  ADD COLUMN IF NOT EXISTS peak_score numeric(3,2);

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS last_peak_alert_at timestamptz;

CREATE TABLE IF NOT EXISTS public.peak_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES public.sa_cities(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour_of_day smallint NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  ride_count integer NOT NULL DEFAULT 0,
  avg_wait_sec integer,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, day_of_week, hour_of_day)
);
GRANT SELECT ON public.peak_zones TO authenticated;
GRANT ALL ON public.peak_zones TO service_role;
ALTER TABLE public.peak_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read peak_zones" ON public.peak_zones FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

CREATE TABLE IF NOT EXISTS public.weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES public.sa_cities(id) ON DELETE CASCADE UNIQUE,
  temperature_c numeric(4,1),
  condition text,
  is_severe boolean DEFAULT false,
  weather_factor numeric(3,2) DEFAULT 1.0,
  raw jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weather_cache TO authenticated;
GRANT ALL ON public.weather_cache TO service_role;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read weather_cache" ON public.weather_cache FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_fare numeric(6,2) NOT NULL DEFAULT 5.0,
  per_km numeric(6,2) NOT NULL DEFAULT 1.8,
  per_min numeric(6,2) NOT NULL DEFAULT 0.4,
  min_fare numeric(6,2) NOT NULL DEFAULT 10.0,
  max_surge numeric(3,2) NOT NULL DEFAULT 2.5,
  peak_surge_factor numeric(3,2) NOT NULL DEFAULT 1.5,
  weather_surge_factor numeric(3,2) NOT NULL DEFAULT 1.3,
  holiday_surge_factor numeric(3,2) NOT NULL DEFAULT 1.2,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.pricing_config (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.pricing_config TO authenticated;
GRANT ALL ON public.pricing_config TO service_role;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage pricing" ON public.pricing_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.peak_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES public.sa_cities(id) ON DELETE CASCADE,
  predicted_at timestamptz NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  expected_rides integer,
  peak_score numeric(3,2),
  notified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_peak_predictions_window ON public.peak_predictions(window_start, notified);
GRANT SELECT ON public.peak_predictions TO authenticated;
GRANT ALL ON public.peak_predictions TO service_role;
ALTER TABLE public.peak_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read predictions" ON public.peak_predictions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

CREATE OR REPLACE FUNCTION public.aggregate_peak_zones()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.peak_zones (city_id, day_of_week, hour_of_day, ride_count, last_updated)
  SELECT pickup_city_id,
    EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Riyadh'))::smallint,
    EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Riyadh'))::smallint,
    COUNT(*), now()
  FROM public.rides
  WHERE pickup_city_id IS NOT NULL AND created_at > now() - interval '90 days'
  GROUP BY 1, 2, 3
  ON CONFLICT (city_id, day_of_week, hour_of_day)
  DO UPDATE SET ride_count = EXCLUDED.ride_count, last_updated = now();
END; $$;

CREATE OR REPLACE FUNCTION public.predict_peak_now(_city_id uuid)
RETURNS TABLE(peak_score numeric, expected_rides integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _dow smallint; _hour smallint; _current_count integer; _max_count integer;
BEGIN
  _dow := EXTRACT(DOW FROM (now() AT TIME ZONE 'Asia/Riyadh'))::smallint;
  _hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Asia/Riyadh'))::smallint;
  SELECT COALESCE(ride_count, 0) INTO _current_count FROM public.peak_zones
  WHERE city_id = _city_id AND day_of_week = _dow AND hour_of_day = _hour;
  SELECT COALESCE(MAX(ride_count), 1) INTO _max_count FROM public.peak_zones WHERE city_id = _city_id;
  peak_score := LEAST(1.0, (_current_count::numeric / GREATEST(_max_count, 1)));
  expected_rides := _current_count;
  RETURN NEXT;
END; $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
