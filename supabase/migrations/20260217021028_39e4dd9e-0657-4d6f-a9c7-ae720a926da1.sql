
-- Create notifications table for in-app alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Trainers can insert notifications for their students
CREATE POLICY "Trainers insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Function to auto-create notification when workout is created
CREATE OR REPLACE FUNCTION public.notify_workout_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, workout_id)
    SELECT s.user_id, 'Novo treino!', 'Seu treinador prescreveu: ' || NEW.title, NEW.id
    FROM public.students s WHERE s.id = NEW.student_id;
  END IF;
  
  IF NEW.is_group AND NEW.group_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, workout_id)
    SELECT s.user_id, 'Novo treino!', 'Treino em grupo: ' || NEW.title, NEW.id
    FROM public.group_members gm
    JOIN public.students s ON s.id = gm.student_id
    WHERE gm.group_id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_workout_created
  AFTER INSERT ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_workout_created();
