
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'cliente');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'cliente',
  UNIQUE(user_id, role)
);

-- Trainers
CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(group_id, student_id)
);

-- Exercises catalog
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workouts
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hibrido',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_group BOOLEAN NOT NULL DEFAULT false,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  week_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workout exercises
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  suggested_load TEXT,
  notes TEXT,
  video_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Workout logs (student completion)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, workout_id)
);

-- Exercise logs (per set)
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  reps_done INTEGER,
  load_used NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_students_trainer ON public.students(trainer_id);
CREATE INDEX idx_workouts_trainer ON public.workouts(trainer_id);
CREATE INDEX idx_workouts_student ON public.workouts(student_id);
CREATE INDEX idx_workouts_group ON public.workouts(group_id);
CREATE INDEX idx_workouts_date ON public.workouts(date);
CREATE INDEX idx_workout_exercises_workout ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_logs_student ON public.workout_logs(student_id);
CREATE INDEX idx_exercise_logs_workout_log ON public.exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise ON public.exercise_logs(exercise_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_student ON public.group_members(student_id);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get trainer_id for a user
CREATE OR REPLACE FUNCTION public.get_trainer_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.trainers WHERE user_id = _user_id LIMIT 1
$$;

-- Helper: get student_id for a user
CREATE OR REPLACE FUNCTION public.get_student_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  INSERT INTO public.students (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS ============

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Trainers read their students profiles" ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = profiles.user_id
        AND s.trainer_id = public.get_trainer_id(auth.uid())
    )
  );
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT
  WITH CHECK (true);

-- USER_ROLES
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts roles" ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- TRAINERS
CREATE POLICY "Trainers read own" ON public.trainers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage trainers" ON public.trainers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts trainers" ON public.trainers FOR INSERT
  WITH CHECK (true);

-- STUDENTS
CREATE POLICY "Students read own" ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Trainers read their students" ON public.students FOR SELECT TO authenticated
  USING (trainer_id = public.get_trainer_id(auth.uid()));
CREATE POLICY "Trainers manage their students" ON public.students FOR UPDATE TO authenticated
  USING (trainer_id = public.get_trainer_id(auth.uid()));
CREATE POLICY "Trainers assign students" ON public.students FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "System inserts students" ON public.students FOR INSERT
  WITH CHECK (true);

-- GROUPS
CREATE POLICY "Trainers manage own groups" ON public.groups FOR ALL TO authenticated
  USING (trainer_id = public.get_trainer_id(auth.uid()));
CREATE POLICY "Students read their groups" ON public.groups FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id
        AND gm.student_id = public.get_student_id(auth.uid())
    )
  );

-- GROUP_MEMBERS
CREATE POLICY "Trainers manage group members" ON public.group_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND g.trainer_id = public.get_trainer_id(auth.uid())
    )
  );
CREATE POLICY "Students read own memberships" ON public.group_members FOR SELECT TO authenticated
  USING (student_id = public.get_student_id(auth.uid()));

-- EXERCISES (readable by all authenticated, writable by trainers/admins)
CREATE POLICY "All read exercises" ON public.exercises FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Trainers insert exercises" ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers update exercises" ON public.exercises FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

-- WORKOUTS
CREATE POLICY "Trainers manage own workouts" ON public.workouts FOR ALL TO authenticated
  USING (trainer_id = public.get_trainer_id(auth.uid()));
CREATE POLICY "Students read assigned workouts" ON public.workouts FOR SELECT TO authenticated
  USING (
    student_id = public.get_student_id(auth.uid())
    OR (is_group AND group_id IN (
      SELECT gm.group_id FROM public.group_members gm
      WHERE gm.student_id = public.get_student_id(auth.uid())
    ))
  );

-- WORKOUT_EXERCISES
CREATE POLICY "Trainers manage workout exercises" ON public.workout_exercises FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.trainer_id = public.get_trainer_id(auth.uid())
    )
  );
CREATE POLICY "Students read workout exercises" ON public.workout_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND (
          w.student_id = public.get_student_id(auth.uid())
          OR (w.is_group AND w.group_id IN (
            SELECT gm.group_id FROM public.group_members gm
            WHERE gm.student_id = public.get_student_id(auth.uid())
          ))
        )
    )
  );

-- WORKOUT_LOGS
CREATE POLICY "Students manage own logs" ON public.workout_logs FOR ALL TO authenticated
  USING (student_id = public.get_student_id(auth.uid()));
CREATE POLICY "Trainers read their students logs" ON public.workout_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = workout_logs.student_id
        AND s.trainer_id = public.get_trainer_id(auth.uid())
    )
  );

-- EXERCISE_LOGS
CREATE POLICY "Students manage own exercise logs" ON public.exercise_logs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = exercise_logs.workout_log_id
        AND wl.student_id = public.get_student_id(auth.uid())
    )
  );
CREATE POLICY "Trainers read their students exercise logs" ON public.exercise_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      JOIN public.students s ON s.id = wl.student_id
      WHERE wl.id = exercise_logs.workout_log_id
        AND s.trainer_id = public.get_trainer_id(auth.uid())
    )
  );

-- Seed some common exercises
INSERT INTO public.exercises (name, category) VALUES
  ('Back Squat', 'musculação'),
  ('Front Squat', 'musculação'),
  ('Deadlift', 'musculação'),
  ('Bench Press', 'musculação'),
  ('Overhead Press', 'musculação'),
  ('Pull-up', 'crossfit'),
  ('Muscle-up', 'crossfit'),
  ('Clean & Jerk', 'crossfit'),
  ('Snatch', 'crossfit'),
  ('Thruster', 'crossfit'),
  ('Box Jump', 'crossfit'),
  ('Wall Ball', 'crossfit'),
  ('Burpee', 'condicionamento'),
  ('Rowing', 'condicionamento'),
  ('Assault Bike', 'condicionamento'),
  ('Double Under', 'crossfit'),
  ('Toes to Bar', 'crossfit'),
  ('Handstand Push-up', 'crossfit'),
  ('Supino Inclinado', 'musculação'),
  ('Rosca Direta', 'musculação'),
  ('Leg Press', 'musculação'),
  ('Stiff', 'musculação'),
  ('Remada Curvada', 'musculação'),
  ('Desenvolvimento', 'musculação'),
  ('Agachamento Búlgaro', 'musculação'),
  ('Kettlebell Swing', 'crossfit'),
  ('Turkish Get-up', 'crossfit'),
  ('Rope Climb', 'crossfit'),
  ('Running 400m', 'condicionamento'),
  ('Running 800m', 'condicionamento');
