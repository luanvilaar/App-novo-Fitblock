-- Adaptações do atleta na sessão: substituição de movimento e observações (feedback ao treinador)
CREATE TABLE public.workout_exercise_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  substitute_exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  student_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workout_log_id, workout_exercise_id)
);

CREATE INDEX idx_wea_workout_log ON public.workout_exercise_adaptations(workout_log_id);
CREATE INDEX idx_wea_wex ON public.workout_exercise_adaptations(workout_exercise_id);

-- Identificar a linha do treino no registo de séries
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS workout_exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_exercise
  ON public.exercise_logs(workout_exercise_id)
  WHERE workout_exercise_id IS NOT NULL;

ALTER TABLE public.workout_exercise_adaptations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own workout exercise adaptations"
  ON public.workout_exercise_adaptations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_exercise_adaptations.workout_log_id
        AND wl.student_id = public.get_student_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_exercise_adaptations.workout_log_id
        AND wl.student_id = public.get_student_id(auth.uid())
    )
  );

CREATE POLICY "Trainers read their students exercise adaptations"
  ON public.workout_exercise_adaptations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      JOIN public.students s ON s.id = wl.student_id
      JOIN public.workouts w ON w.id = wl.workout_id
      WHERE wl.id = workout_exercise_adaptations.workout_log_id
        AND w.trainer_id = public.get_trainer_id(auth.uid())
    )
  );

COMMENT ON TABLE public.workout_exercise_adaptations IS
  'Substituição de exercício e notas do atleta numa execução (por linha de workout_exercises).';
