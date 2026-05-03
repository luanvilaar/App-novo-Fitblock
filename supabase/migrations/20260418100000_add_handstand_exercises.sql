-- Add new Handstand exercises
INSERT INTO public.exercises (name, category, video_url)
SELECT 'Freestanding Handstand Shoulder Taps', 'crossfit', 'https://youtu.be/D9MNUwmrJBY'
WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises WHERE name = 'Freestanding Handstand Shoulder Taps'
);

INSERT INTO public.exercises (name, category, video_url)
SELECT 'Handstand Pirouettes 3 a 5 passos', 'crossfit', 'https://www.youtube.com/shorts/QqrXSTGFbAg'
WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises WHERE name = 'Handstand Pirouettes 3 a 5 passos'
);
