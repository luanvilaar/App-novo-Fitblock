-- Add description field to workouts for free-text prescription
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS description text;

-- Add Corrida exercise for ENDURANCE workout
INSERT INTO public.exercises (name, category) VALUES ('Corrida', 'cardio') ON CONFLICT DO NOTHING;