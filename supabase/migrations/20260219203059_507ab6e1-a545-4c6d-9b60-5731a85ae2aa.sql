
-- Add admin SELECT policy for profiles (needed for AdminPanel)
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin SELECT policy for user_roles (needed for AdminPanel)  
CREATE POLICY "Admins read all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
