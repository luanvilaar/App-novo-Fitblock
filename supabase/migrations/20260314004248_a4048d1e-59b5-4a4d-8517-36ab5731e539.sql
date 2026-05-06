
-- Fix overly permissive notification insert policy
DROP POLICY "System inserts notifications" ON public.community_notifications;
CREATE POLICY "Authenticated insert notifications" ON public.community_notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (actor_id = auth.uid());
