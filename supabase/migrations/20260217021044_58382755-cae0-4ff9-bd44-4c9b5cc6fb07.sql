
-- Fix: Replace overly permissive INSERT policy with proper trainer check
DROP POLICY "Trainers insert notifications" ON public.notifications;

CREATE POLICY "Trainers insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
