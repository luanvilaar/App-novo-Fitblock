-- Pedidos de vínculo: triggers gravam em notifications, mas a política de INSERT
-- só permitia treinador/admin. Atletas (só role cliente) falhavam no trigger e
-- o INSERT em athlete_link_requests era revertido inteiro.
-- Mesmo padrão de notify_workout_created(): SECURITY DEFINER + search_path fixo.

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
    JOIN public.profiles p ON p.user_id = (SELECT user_id FROM public.students WHERE id = NEW.student_id)
    WHERE t.id = NEW.trainer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_athlete_link_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, created_at)
    SELECT
      s.user_id,
      CASE
        WHEN NEW.status = 'approved' THEN 'Vínculo Aprovado'
        ELSE 'Solicitação Recusada'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'Seu vínculo foi aprovado! Acesse seus treinos agora.'
        ELSE 'Sua solicitação de vínculo foi recusada.'
      END,
      NOW()
    FROM public.students s
    WHERE s.id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;
