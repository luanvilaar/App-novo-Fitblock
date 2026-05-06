-- Periodização por semana (mesociclo): fases clássicas em blocos.
-- week_start = segunda-feira da semana (ISO); validar na aplicação.

CREATE TABLE public.training_period_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('accumulation', 'transmutation', 'realization')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, week_start)
);

CREATE INDEX idx_training_period_weeks_student_week ON public.training_period_weeks (student_id, week_start);

COMMENT ON TABLE public.training_period_weeks IS 'Fase de periodização por semana (segunda a domingo) por aluno.';
COMMENT ON COLUMN public.training_period_weeks.week_start IS 'Segunda-feira da semana (date-only).';
COMMENT ON COLUMN public.training_period_weeks.phase IS 'accumulation | transmutation | realization';

ALTER TABLE public.training_period_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own periodization weeks"
  ON public.training_period_weeks FOR SELECT
  TO authenticated
  USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Trainers manage periodization weeks for their students"
  ON public.training_period_weeks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = training_period_weeks.student_id
        AND s.trainer_id = public.get_trainer_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = training_period_weeks.student_id
        AND s.trainer_id = public.get_trainer_id(auth.uid())
    )
  );

CREATE POLICY "Admins manage periodization weeks"
  ON public.training_period_weeks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.set_training_period_weeks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_training_period_weeks_updated_at
  BEFORE UPDATE ON public.training_period_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_training_period_weeks_updated_at();
