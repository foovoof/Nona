
REVOKE EXECUTE ON FUNCTION public.aggregate_peak_zones() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.predict_peak_now(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_peak_zones() TO service_role;
GRANT EXECUTE ON FUNCTION public.predict_peak_now(uuid) TO service_role;
