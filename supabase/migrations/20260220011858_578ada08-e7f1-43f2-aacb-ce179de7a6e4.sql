
-- 1. Fix exercises: restrict to authenticated users only
DROP POLICY IF EXISTS "All read exercises" ON public.exercises;
CREATE POLICY "Authenticated read exercises"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix ineffective deny policies - drop and recreate targeting anon role properly
-- profiles
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles FOR ALL
  TO anon
  USING (false);

-- user_roles
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
CREATE POLICY "Deny anonymous access to user_roles"
  ON public.user_roles FOR ALL
  TO anon
  USING (false);

-- students
DROP POLICY IF EXISTS "Deny anonymous access to students" ON public.students;
CREATE POLICY "Deny anonymous access to students"
  ON public.students FOR ALL
  TO anon
  USING (false);

-- trainers
DROP POLICY IF EXISTS "Deny anonymous access to trainers" ON public.trainers;
CREATE POLICY "Deny anonymous access to trainers"
  ON public.trainers FOR ALL
  TO anon
  USING (false);

-- notifications
DROP POLICY IF EXISTS "Deny anonymous access to notifications" ON public.notifications;
CREATE POLICY "Deny anonymous access to notifications"
  ON public.notifications FOR ALL
  TO anon
  USING (false);

-- Also deny anon on exercises
CREATE POLICY "Deny anonymous access to exercises"
  ON public.exercises FOR ALL
  TO anon
  USING (false);
