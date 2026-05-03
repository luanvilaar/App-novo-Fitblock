
-- Fix overly permissive INSERT policies by restricting to service_role only
DROP POLICY "System inserts profiles" ON public.profiles;
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY "System inserts roles" ON public.user_roles;
CREATE POLICY "System inserts roles" ON public.user_roles FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY "System inserts trainers" ON public.trainers;
CREATE POLICY "System inserts trainers" ON public.trainers FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY "System inserts students" ON public.students;
CREATE POLICY "System inserts students" ON public.students FOR INSERT TO service_role
  WITH CHECK (true);
