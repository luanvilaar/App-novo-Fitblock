-- Add block_label column to workout_exercises to support circuits/blocks
ALTER TABLE public.workout_exercises ADD COLUMN block_label text DEFAULT NULL;

COMMENT ON COLUMN public.workout_exercises.block_label IS 'Groups exercises into named blocks/circuits (e.g., FORÇA | LPO, CONDICIONAMENTO)';
