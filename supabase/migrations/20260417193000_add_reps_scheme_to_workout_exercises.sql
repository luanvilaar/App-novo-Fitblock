-- Add per-set reps prescription support
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS reps_scheme TEXT[];

COMMENT ON COLUMN workout_exercises.reps_scheme IS
'Optional per-set reps prescription, e.g. {12,12,8,6}';
