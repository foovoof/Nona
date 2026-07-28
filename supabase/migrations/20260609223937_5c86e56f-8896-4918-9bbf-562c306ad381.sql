
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nearby_drivers(double precision, double precision, double precision, public.gender_pref, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.nearby_drivers(double precision, double precision, double precision, public.gender_pref, integer, boolean) TO service_role;

CREATE POLICY "admins read bot_states" ON public.bot_states FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
