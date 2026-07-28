
REVOKE EXECUTE ON FUNCTION public.nearby_drivers(double precision,double precision,double precision,gender_pref,integer,boolean,uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.city_for_point(double precision,double precision) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_drivers(double precision,double precision,double precision,gender_pref,integer,boolean,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.city_for_point(double precision,double precision) TO service_role;
