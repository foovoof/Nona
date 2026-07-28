
CREATE TYPE public.app_role AS ENUM ('admin', 'support');
CREATE TYPE public.gender AS ENUM ('male', 'female');
CREATE TYPE public.gender_pref AS ENUM ('male', 'female', 'any');
CREATE TYPE public.driver_status AS ENUM ('offline', 'available', 'busy');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'expired', 'suspended');
CREATE TYPE public.ride_status AS ENUM ('searching', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled', 'failed');
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'cancelled');
CREATE TYPE public.bot_role AS ENUM ('driver', 'rider');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL UNIQUE,
  name text, phone text, national_id text, national_id_photo_url text,
  car_type text, car_model text, car_color text, car_plate text,
  gender public.gender,
  status public.driver_status NOT NULL DEFAULT 'offline',
  subscription_status public.subscription_status NOT NULL DEFAULT 'pending',
  subscription_plan text, subscription_start timestamptz, subscription_end timestamptz,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  total_rides integer NOT NULL DEFAULT 0,
  total_cancellations integer NOT NULL DEFAULT 0,
  flagged boolean NOT NULL DEFAULT false,
  share_name boolean NOT NULL DEFAULT false,
  share_phone boolean NOT NULL DEFAULT false,
  registration_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read drivers" ON public.drivers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.driver_locations (
  driver_id uuid PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_driver_locations_latlng ON public.driver_locations(latitude, longitude);
GRANT SELECT ON public.driver_locations TO authenticated;
GRANT ALL ON public.driver_locations TO service_role;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read locations" ON public.driver_locations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

CREATE TABLE public.riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL UNIQUE,
  name text, phone text, gender public.gender,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  total_rides integer NOT NULL DEFAULT 0,
  total_cancellations integer NOT NULL DEFAULT 0,
  flagged boolean NOT NULL DEFAULT false,
  share_name boolean NOT NULL DEFAULT false,
  share_phone boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.riders TO authenticated;
GRANT ALL ON public.riders TO service_role;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read riders" ON public.riders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
CREATE TRIGGER trg_riders_updated BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  pickup_lat double precision NOT NULL, pickup_lng double precision NOT NULL, pickup_name text NOT NULL,
  drop_lat double precision NOT NULL, drop_lng double precision NOT NULL, drop_name text NOT NULL,
  driver_gender_pref public.gender_pref NOT NULL DEFAULT 'any',
  status public.ride_status NOT NULL DEFAULT 'searching',
  dispatch_wave integer NOT NULL DEFAULT 0,
  notes text,
  accepted_at timestamptz, started_at timestamptz, completed_at timestamptz,
  cancelled_at timestamptz, cancelled_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rides_rider ON public.rides(rider_id);
CREATE INDEX idx_rides_driver ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
GRANT SELECT ON public.rides TO authenticated;
GRANT ALL ON public.rides TO service_role;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read rides" ON public.rides FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
CREATE TRIGGER trg_rides_updated BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ride_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status public.offer_status NOT NULL DEFAULT 'pending',
  distance_km numeric(6,2),
  message_id bigint,
  sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz
);
CREATE INDEX idx_ride_offers_ride ON public.ride_offers(ride_id);
CREATE INDEX idx_ride_offers_driver ON public.ride_offers(driver_id);
GRANT SELECT ON public.ride_offers TO authenticated;
GRANT ALL ON public.ride_offers TO service_role;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read offers" ON public.ride_offers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_role public.bot_role NOT NULL,
  message_type text NOT NULL,
  content text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_ride ON public.messages(ride_id);
GRANT SELECT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL UNIQUE REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_rating integer, driver_comment text,
  rider_rating integer, rider_comment text,
  ai_rating numeric(3,2), ai_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read ratings" ON public.ratings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.emergency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES public.rides(id) ON DELETE SET NULL,
  rider_id uuid REFERENCES public.riders(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  location_lat double precision, location_lng double precision,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.emergency_logs TO authenticated;
GRANT ALL ON public.emergency_logs TO service_role;
ALTER TABLE public.emergency_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read emergencies" ON public.emergency_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
CREATE POLICY "admins update emergencies" ON public.emergency_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role public.bot_role NOT NULL,
  user_telegram_id bigint NOT NULL,
  subject text, message text NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid, reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
CREATE POLICY "admins update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bot_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  bot_role public.bot_role NOT NULL,
  state text NOT NULL DEFAULT 'idle',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telegram_id, bot_role)
);
GRANT ALL ON public.bot_states TO service_role;
ALTER TABLE public.bot_states ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage config" ON public.app_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.nearby_drivers(
  _lat double precision, _lng double precision,
  _radius_km double precision DEFAULT 10,
  _gender_pref public.gender_pref DEFAULT 'any',
  _limit integer DEFAULT 10,
  _require_subscription boolean DEFAULT true
)
RETURNS TABLE (driver_id uuid, telegram_id bigint, distance_km double precision, rating_avg numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (
    SELECT d.id AS driver_id, d.telegram_id,
      (6371 * acos(
        cos(radians(_lat)) * cos(radians(dl.latitude)) *
        cos(radians(dl.longitude) - radians(_lng)) +
        sin(radians(_lat)) * sin(radians(dl.latitude))
      )) AS distance_km,
      d.rating_avg
    FROM public.drivers d
    JOIN public.driver_locations dl ON dl.driver_id = d.id
    WHERE d.status = 'available'
      AND d.registration_complete = true
      AND (NOT _require_subscription OR d.subscription_status = 'active')
      AND (_gender_pref = 'any' OR d.gender::text = _gender_pref::text)
      AND dl.updated_at > now() - interval '5 minutes'
  ) sub
  WHERE sub.distance_km <= _radius_km
  ORDER BY sub.distance_km ASC, sub.rating_avg DESC
  LIMIT _limit;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_offers;
