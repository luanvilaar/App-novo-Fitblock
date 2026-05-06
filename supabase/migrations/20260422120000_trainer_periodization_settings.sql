-- Nomes de fase personalizáveis (legenda) por treinador, sem expor UPDATE na tabela trainers.
CREATE TABLE IF NOT EXISTS public.trainer_periodization_settings (
  trainer_id uuid PRIMARY KEY REFERENCES public.trainers (id) ON DELETE CASCADE,
  period_phase_labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trainer_periodization_settings IS
  'Nomes de exibição por fase (chaves: accumulation, transmutation, realization). Vazio = defaults na app.';

CREATE OR REPLACE FUNCTION public.set_trainer_periodization_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trainer_periodization_settings_updated_at
  ON public.trainer_periodization_settings;
CREATE TRIGGER trg_trainer_periodization_settings_updated_at
  BEFORE UPDATE ON public.trainer_periodization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trainer_periodization_settings_updated_at();

ALTER TABLE public.trainer_periodization_settings ENABLE ROW LEVEL SECURITY;

-- Treinador: leitura e escrita da própria linha
CREATE POLICY "trainers manage own periodization settings"
  ON public.trainer_periodization_settings
  FOR ALL
  TO authenticated
  USING (trainer_id = get_trainer_id (auth.uid()))
  WITH CHECK (trainer_id = get_trainer_id (auth.uid()));

-- Aluno: lê as definições do seu treinador (para a legenda no dashboard)
CREATE POLICY "students read their trainer periodization settings"
  ON public.trainer_periodization_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE
        s.trainer_id = trainer_periodization_settings.trainer_id
        AND s.user_id = auth.uid()
    )
  );
