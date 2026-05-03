-- 1. Update handle_new_user to set active = false for new students
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  INSERT INTO public.students (user_id, active)
  VALUES (NEW.id, false);
  
  RETURN NEW;
END;
$function$;

-- 2. Allow authenticated clients to read trainers (for onboarding search)
CREATE POLICY "Clients read trainers for onboarding"
ON public.trainers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'cliente'::app_role));

-- 3. Allow clients to read trainer profiles (for displaying names)
CREATE POLICY "Clients read trainer profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trainers t WHERE t.user_id = profiles.user_id
  )
  AND has_role(auth.uid(), 'cliente'::app_role)
);

-- 4. Allow students to update their own trainer_id (for onboarding link)
CREATE POLICY "Students set own trainer"
ON public.students
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());