-- Migration: add load_type to workout_exercises
-- Adiciona campo para indicar se a carga é em kg ou percentual

ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS load_type TEXT DEFAULT 'kg' CHECK (load_type IN ('kg', 'percent'));

COMMENT ON COLUMN workout_exercises.load_type IS 'Tipo de carga: kg (absoluta) ou percent (percentual do 1RM)';
