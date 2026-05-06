
-- Fix 1: Restrict "System inserts" policies to service_role only
-- This prevents authenticated users from escalating privileges
-- The handle_new_user() trigger runs as SECURITY DEFINER (bypasses RLS), so it still works

-- profiles: restrict system insert to service_role
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;
CREATE POLICY "System inserts profiles"
  ON public.profiles FOR INSERT TO service_role
  WITH CHECK (true);

-- user_roles: restrict system insert to service_role  
DROP POLICY IF EXISTS "System inserts roles" ON public.user_roles;
CREATE POLICY "System inserts roles"
  ON public.user_roles FOR INSERT TO service_role
  WITH CHECK (true);

-- students: restrict system insert to service_role
DROP POLICY IF EXISTS "System inserts students" ON public.students;
CREATE POLICY "System inserts students"
  ON public.students FOR INSERT TO service_role
  WITH CHECK (true);

-- trainers: restrict system insert to service_role
DROP POLICY IF EXISTS "System inserts trainers" ON public.trainers;
CREATE POLICY "System inserts trainers"
  ON public.trainers FOR INSERT TO service_role
  WITH CHECK (true);

-- Fix 2: Add explicit deny policies for anon role on sensitive tables
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles FOR ALL TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to user_roles"
  ON public.user_roles FOR ALL TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to students"
  ON public.students FOR ALL TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to trainers"
  ON public.trainers FOR ALL TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to notifications"
  ON public.notifications FOR ALL TO anon
  USING (false);
