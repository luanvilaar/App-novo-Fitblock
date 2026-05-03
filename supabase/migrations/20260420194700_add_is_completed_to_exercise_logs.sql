-- Idempotente: a coluna pode já existir se aplicada manualmente ou por outro branch.
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
