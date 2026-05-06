-- Fix user_roles policies: change from RESTRICTIVE to PERMISSIVE
-- Currently all policies are RESTRICTIVE which means no access is ever granted

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "System inserts roles" ON public.user_roles;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System inserts roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- Also fix other tables that might have the same issue
-- Fix profiles policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers read their students profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Trainers read their students profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM students s WHERE s.user_id = profiles.user_id AND s.trainer_id = get_trainer_id(auth.uid())));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System inserts profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Fix students policies
DROP POLICY IF EXISTS "Students read own" ON public.students;
DROP POLICY IF EXISTS "Trainers read their students" ON public.students;
DROP POLICY IF EXISTS "Trainers assign students" ON public.students;
DROP POLICY IF EXISTS "Trainers manage their students" ON public.students;
DROP POLICY IF EXISTS "System inserts students" ON public.students;

CREATE POLICY "Students read own"
  ON public.students FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Trainers read their students"
  ON public.students FOR SELECT
  USING (trainer_id = get_trainer_id(auth.uid()));

CREATE POLICY "Trainers assign students"
  ON public.students FOR UPDATE
  USING (has_role(auth.uid(), 'trainer'::app_role));

CREATE POLICY "Trainers manage their students"
  ON public.students FOR UPDATE
  USING (trainer_id = get_trainer_id(auth.uid()));

CREATE POLICY "System inserts students"
  ON public.students FOR INSERT
  WITH CHECK (true);

-- Fix trainers policies
DROP POLICY IF EXISTS "Trainers read own" ON public.trainers;
DROP POLICY IF EXISTS "Admins manage trainers" ON public.trainers;
DROP POLICY IF EXISTS "System inserts trainers" ON public.trainers;

CREATE POLICY "Trainers read own"
  ON public.trainers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage trainers"
  ON public.trainers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System inserts trainers"
  ON public.trainers FOR INSERT
  WITH CHECK (true);

-- Fix exercises policies
DROP POLICY IF EXISTS "All read exercises" ON public.exercises;
DROP POLICY IF EXISTS "Trainers insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Trainers update exercises" ON public.exercises;

CREATE POLICY "All read exercises"
  ON public.exercises FOR SELECT
  USING (true);

CREATE POLICY "Trainers insert exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Trainers update exercises"
  ON public.exercises FOR UPDATE
  USING (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix workouts policies
DROP POLICY IF EXISTS "Students read assigned workouts" ON public.workouts;
DROP POLICY IF EXISTS "Trainers manage own workouts" ON public.workouts;

CREATE POLICY "Students read assigned workouts"
  ON public.workouts FOR SELECT
  USING (
    student_id = get_student_id(auth.uid())
    OR (is_group AND group_id IN (SELECT student_group_ids(get_student_id(auth.uid()))))
  );

CREATE POLICY "Trainers manage own workouts"
  ON public.workouts FOR ALL
  USING (trainer_id = get_trainer_id(auth.uid()));

-- Fix workout_exercises policies
DROP POLICY IF EXISTS "Students read workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Trainers manage workout exercises" ON public.workout_exercises;

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

CREATE POLICY "Trainers manage workout exercises"
  ON public.workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND w.trainer_id = get_trainer_id(auth.uid())
    )
  );

-- Fix groups policies
DROP POLICY IF EXISTS "Students read their groups" ON public.groups;
DROP POLICY IF EXISTS "Trainers manage own groups" ON public.groups;

CREATE POLICY "Students read their groups"
  ON public.groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.student_id = get_student_id(auth.uid())));

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
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.trainer_id = get_trainer_id(auth.uid())));

-- Fix workout_logs policies
DROP POLICY IF EXISTS "Students manage own logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Trainers read their students logs" ON public.workout_logs;

CREATE POLICY "Students manage own logs"
  ON public.workout_logs FOR ALL
  USING (student_id = get_student_id(auth.uid()));

CREATE POLICY "Trainers read their students logs"
  ON public.workout_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = workout_logs.student_id AND s.trainer_id = get_trainer_id(auth.uid())));

-- Fix exercise_logs policies
DROP POLICY IF EXISTS "Students manage own exercise logs" ON public.exercise_logs;
DROP POLICY IF EXISTS "Trainers read their students exercise logs" ON public.exercise_logs;

CREATE POLICY "Students manage own exercise logs"
  ON public.exercise_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_logs wl WHERE wl.id = exercise_logs.workout_log_id AND wl.student_id = get_student_id(auth.uid())));

CREATE POLICY "Trainers read their students exercise logs"
  ON public.exercise_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM workout_logs wl JOIN students s ON s.id = wl.student_id WHERE wl.id = exercise_logs.workout_log_id AND s.trainer_id = get_trainer_id(auth.uid())));

-- Fix notifications policies
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Trainers insert notifications" ON public.notifications;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Trainers insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
