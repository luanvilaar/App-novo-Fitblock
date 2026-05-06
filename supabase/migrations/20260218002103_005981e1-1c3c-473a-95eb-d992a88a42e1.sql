
-- Table for METCON blocks within workouts (free text description + type)
CREATE TABLE public.workout_metcons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT NOT NULL DEFAULT '',
  metcon_type TEXT NOT NULL DEFAULT 'FOR TIME',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_metcons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage workout metcons"
ON public.workout_metcons FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.workouts w
  WHERE w.id = workout_metcons.workout_id
  AND w.trainer_id = get_trainer_id(auth.uid())
));

CREATE POLICY "Students read workout metcons"
ON public.workout_metcons FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workouts w
  WHERE w.id = workout_metcons.workout_id
  AND (
    w.student_id = get_student_id(auth.uid())
    OR (w.is_group AND w.group_id IN (SELECT student_group_ids(get_student_id(auth.uid()))))
  )
));

-- Table for athlete scores on METCONs
CREATE TABLE public.metcon_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metcon_id UUID NOT NULL REFERENCES public.workout_metcons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  score_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(metcon_id, student_id)
);

ALTER TABLE public.metcon_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own metcon scores"
ON public.metcon_scores FOR ALL
USING (student_id = get_student_id(auth.uid()));

CREATE POLICY "Trainers read their students metcon scores"
ON public.metcon_scores FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = metcon_scores.student_id
  AND s.trainer_id = get_trainer_id(auth.uid())
));

-- Add superset_group_id to workout_exercises for bi-set linking
ALTER TABLE public.workout_exercises ADD COLUMN superset_group_id TEXT;
