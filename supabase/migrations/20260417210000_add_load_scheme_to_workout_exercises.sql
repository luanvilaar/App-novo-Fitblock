-- Add per-set load prescription support
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS load_scheme TEXT[];

COMMENT ON COLUMN workout_exercises.load_scheme IS
'Optional per-set load prescription, e.g. {60%,65%,70%,75%}';
