-- Remove the trigger and function that use pg_net (not available)
DROP TRIGGER IF EXISTS on_new_profile_notify_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_admin_on_new_user();