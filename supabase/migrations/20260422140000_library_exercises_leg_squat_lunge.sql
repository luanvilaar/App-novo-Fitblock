-- Movimentos adicionais na biblioteca (pernas / agachamento / avanço)
INSERT INTO public.exercises (name, category, video_url)
SELECT 'Back Squat', 'força', 'https://youtu.be/_gTM-oBKHw0'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Back Squat');

INSERT INTO public.exercises (name, category, video_url)
SELECT 'Smith Machine Back Squat', 'força', 'https://youtu.be/QcmonZUuumg'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Smith Machine Back Squat');

INSERT INTO public.exercises (name, category, video_url)
SELECT 'Smith Machine Reverse Lunge', 'força', 'https://youtu.be/TK-5lUZZUOs'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Smith Machine Reverse Lunge');

INSERT INTO public.exercises (name, category, video_url)
SELECT 'Leg Extension Machine', 'força', 'https://youtu.be/s1JfTvyWdTs'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Leg Extension Machine');

INSERT INTO public.exercises (name, category, video_url)
SELECT 'Dumbbell Reverse Lunge', 'força', 'https://youtu.be/Q2k3kYbtOcI'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Dumbbell Reverse Lunge');
