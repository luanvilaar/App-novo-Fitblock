-- Fix infinite recursion between groups and group_members
-- Create security definer functions to break the cycle

-- Function to check if trainer owns a group
CREATE OR REPLACE FUNCTION public.trainer_owns_group(_group_id uuid, _trainer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups WHERE id = _group_id AND trainer_id = _trainer_id
  )
$$;

-- Function to check if student is member of a group
CREATE OR REPLACE FUNCTION public.student_is_group_member(_group_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND student_id = _student_id
  )
$$;

-- Fix groups policies
DROP POLICY IF EXISTS "Students read their groups" ON public.groups;
DROP POLICY IF EXISTS "Trainers manage own groups" ON public.groups;

CREATE POLICY "Students read their groups"
  ON public.groups FOR SELECT
  USING (student_is_group_member(id, get_student_id(auth.uid())));

CREATE POLICY "Trainers manage own groups"
  ON public.groups FOR ALL
  USING (trainer_id = get_trainer_id(auth.uid()));

-- Fix group_members policies
DROP POLICY IF EXISTS "Students read own memberships" ON public.group_members;
DROP POLICY IF EXISTS "Trainers manage group members" ON public.group_members;

CREATE POLICY "Students read own memberships"
  ON public.group_members FOR SELECT
  USING (student_id = get_student_id(auth.uid()));

CREATE POLICY "Trainers manage group members"
  ON public.group_members FOR ALL
  USING (trainer_owns_group(group_id, get_trainer_id(auth.uid())));
