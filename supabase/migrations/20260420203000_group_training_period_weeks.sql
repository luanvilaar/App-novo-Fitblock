-- Periodização por semana ao nível do grupo (mesociclo partilhado pelos membros).

CREATE TABLE public.group_training_period_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('accumulation', 'transmutation', 'realization')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, week_start)
);

CREATE INDEX idx_group_training_period_weeks_group_week ON public.group_training_period_weeks (group_id, week_start);

COMMENT ON TABLE public.group_training_period_weeks IS 'Fase de periodização por semana (segunda a domingo) por grupo.';
COMMENT ON COLUMN public.group_training_period_weeks.week_start IS 'Segunda-feira da semana (date-only).';

ALTER TABLE public.group_training_period_weeks ENABLE ROW LEVEL SECURITY;

-- Membros do grupo veem as fases do grupo
CREATE POLICY "Students read group periodization weeks"
  ON public.group_training_period_weeks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_training_period_weeks.group_id
        AND gm.student_id = public.get_student_id(auth.uid())
    )
  );

-- Treinador dono do grupo gere as linhas
CREATE POLICY "Trainers manage group periodization weeks"
  ON public.group_training_period_weeks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_training_period_weeks.group_id
        AND g.trainer_id = public.get_trainer_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_training_period_weeks.group_id
        AND g.trainer_id = public.get_trainer_id(auth.uid())
    )
  );

CREATE POLICY "Admins manage group periodization weeks"
  ON public.group_training_period_weeks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.set_group_training_period_weeks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_group_training_period_weeks_updated_at
  BEFORE UPDATE ON public.group_training_period_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_group_training_period_weeks_updated_at();
