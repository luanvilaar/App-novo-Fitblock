-- 1) Garantir notificação mesmo sem linha em profiles (JOIN inner gerava 0 linhas).
CREATE OR REPLACE FUNCTION public.notify_trainer_link_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, created_at)
    SELECT
      t.user_id,
      'Nova Solicitação de Vínculo',
      'O atleta ' || COALESCE(NULLIF(trim(p.name), ''), 'Um atleta') || ' deseja se vincular a você',
      NOW()
    FROM public.trainers t
    LEFT JOIN public.students s ON s.id = NEW.student_id
    LEFT JOIN public.profiles p ON p.user_id = s.user_id
    WHERE t.id = NEW.trainer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Realtime: idempotente (tabela pode já estar na publicação no Dashboard ou re-run).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'athlete_link_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.athlete_link_requests;
  END IF;
END $$;
