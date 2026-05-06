-- Ao aprovar pedido de vínculo, aplicar trainer_id em students.
-- Permitir novo pedido ao mesmo treinador após rejeição: UNIQUE só para pending.

ALTER TABLE public.athlete_link_requests
  DROP CONSTRAINT IF EXISTS athlete_link_requests_student_id_trainer_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS athlete_link_requests_one_pending_per_pair
  ON public.athlete_link_requests (student_id, trainer_id)
  WHERE (status = 'pending');

CREATE OR REPLACE FUNCTION public.apply_student_trainer_on_link_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'pending'
     AND NEW.status = 'approved' THEN
    UPDATE public.students
    SET
      trainer_id = NEW.trainer_id,
      active = true
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_student_trainer_on_link_approved ON public.athlete_link_requests;
CREATE TRIGGER trg_apply_student_trainer_on_link_approved
  AFTER UPDATE ON public.athlete_link_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_student_trainer_on_link_approved();
