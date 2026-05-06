-- Fitness ranking multi-box foundation
-- Adds affiliate boxes, profile demographics, and box isolation for ranking.
--
-- NOTE: Box isolation is enforced at the APPLICATION LAYER (edge function)
-- to avoid breaking existing trainer-student-onboarding RLS flows.
-- No RESTRICTIVE policies are added intentionally.

-- ============================================================
-- 1. Boxes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active boxes (for UI dropdowns)
DROP POLICY IF EXISTS "Authenticated users read active boxes" ON public.boxes;
CREATE POLICY "Authenticated users read active boxes"
ON public.boxes
FOR SELECT TO authenticated
USING (is_active = true);

-- Public landing page also needs to read boxes (anon)
DROP POLICY IF EXISTS "Anon users read active boxes" ON public.boxes;
CREATE POLICY "Anon users read active boxes"
ON public.boxes
FOR SELECT TO anon
USING (is_active = true);

-- Seed boxes
INSERT INTO public.boxes (slug, name, is_active)
VALUES
  ('fitblock-training', 'FitBlock Training', true),
  ('pulsefit', 'PulseFit', true)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;


-- ============================================================
-- 3. New columns on existing tables
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL;

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL;

ALTER TABLE public.metcon_scores
  ADD COLUMN IF NOT EXISTS box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL;

-- ============================================================
-- 4. Helper functions (now that columns exist)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_default_box_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.boxes
  WHERE slug = 'fitblock-training'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_box_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT box_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Default value for brand-new rows
ALTER TABLE public.profiles ALTER COLUMN box_id SET DEFAULT public.get_default_box_id();
ALTER TABLE public.students ALTER COLUMN box_id SET DEFAULT public.get_default_box_id();

-- ============================================================
-- 4. Backfill existing rows
-- ============================================================
-- All legacy profiles default to FitBlock Training
UPDATE public.profiles
SET box_id = public.get_default_box_id()
WHERE box_id IS NULL;

-- Students inherit box from their own profile
UPDATE public.students s
SET box_id = p.box_id
FROM public.profiles p
WHERE p.user_id = s.user_id
  AND (s.box_id IS NULL OR s.box_id <> p.box_id);

-- Workout logs inherit box from their student
UPDATE public.workout_logs wl
SET box_id = s.box_id
FROM public.students s
WHERE s.id = wl.student_id
  AND wl.box_id IS NULL;

-- Metcon scores inherit box from their student
UPDATE public.metcon_scores ms
SET box_id = s.box_id
FROM public.students s
WHERE s.id = ms.student_id
  AND ms.box_id IS NULL;

-- ============================================================
-- 5. Indexes for ranking query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_box_id   ON public.profiles(box_id);
CREATE INDEX IF NOT EXISTS idx_students_box_id   ON public.students(box_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_box_id ON public.workout_logs(box_id);
CREATE INDEX IF NOT EXISTS idx_metcon_scores_box_id ON public.metcon_scores(box_id);

-- ============================================================
-- 6. Auto-sync triggers
-- ============================================================

-- Students: copy box_id from their profile when not explicitly set
CREATE OR REPLACE FUNCTION public.sync_student_box_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.box_id IS NULL THEN
    SELECT p.box_id INTO NEW.box_id
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id;
    -- Final fallback: default box
    IF NEW.box_id IS NULL THEN
      NEW.box_id := public.get_default_box_id();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_student_box_id ON public.students;
CREATE TRIGGER trg_sync_student_box_id
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.sync_student_box_id();

-- Workout logs + metcon scores: copy box_id from student
CREATE OR REPLACE FUNCTION public.sync_log_box_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.box_id IS NULL THEN
    SELECT s.box_id INTO NEW.box_id
    FROM public.students s
    WHERE s.id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_workout_log_box_id ON public.workout_logs;
CREATE TRIGGER trg_sync_workout_log_box_id
BEFORE INSERT OR UPDATE ON public.workout_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_log_box_id();

DROP TRIGGER IF EXISTS trg_sync_metcon_score_box_id ON public.metcon_scores;
CREATE TRIGGER trg_sync_metcon_score_box_id
BEFORE INSERT OR UPDATE ON public.metcon_scores
FOR EACH ROW EXECUTE FUNCTION public.sync_log_box_id();

-- ============================================================
-- 7. Update handle_new_user to set box_id on signup
--    Supports optional box_id in user metadata for future
--    multi-box onboarding flows; defaults to FitBlock.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_box_id UUID;
BEGIN
  -- Resolve box_id: explicit in metadata > default box
  BEGIN
    v_box_id := (NEW.raw_user_meta_data->>'box_id')::UUID;
  EXCEPTION WHEN others THEN
    v_box_id := NULL;
  END;

  IF v_box_id IS NULL THEN
    SELECT id INTO v_box_id FROM public.boxes WHERE slug = 'fitblock-training' LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, name, email, box_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    v_box_id
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');

  INSERT INTO public.students (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow trainer profiles to be read when looking up trainer name
-- (trainer onboarding search needs to find any trainer's profile)
-- Existing policies already handle this; nothing new needed here.
-- Box isolation for RANKING data is done inside the edge function.
