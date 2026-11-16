-- Event-trigger helper: never meant to be called through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
