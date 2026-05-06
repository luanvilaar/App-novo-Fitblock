
-- Create security definer function to check student group membership
CREATE OR REPLACE FUNCTION public.student_group_ids(_student_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.group_members WHERE student_id = _student_id
$$;

-- Fix workouts policy to avoid recursion through group_members
DROP POLICY "Students read assigned workouts" ON public.workouts;

CREATE POLICY "Students read assigned workouts"
  ON public.workouts FOR SELECT
  USING (
    student_id = get_student_id(auth.uid())
    OR (is_group AND group_id IN (SELECT student_group_ids(get_student_id(auth.uid()))))
  );

-- Fix workout_exercises policy similarly
DROP POLICY "Students read workout exercises" ON public.workout_exercises;

CREATE POLICY "Students read workout exercises"
  ON public.workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND (
        w.student_id = get_student_id(auth.uid())
        OR (w.is_group AND w.group_id IN (SELECT student_group_ids(get_student_id(auth.uid()))))
      )
    )
  );
