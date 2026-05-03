-- Treinador precisa de ler student + profile de atletas com pedido de vínculo pendente
-- (antes do approve, students.trainer_id ainda não aponta para este treinador).

DROP POLICY IF EXISTS "Trainers read students pending link" ON public.students;
CREATE POLICY "Trainers read students pending link"
  ON public.students FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.athlete_link_requests alr
      WHERE alr.student_id = students.id
        AND alr.trainer_id = public.get_trainer_id(auth.uid())
        AND alr.status = 'pending'
    )
  );

DROP POLICY IF EXISTS "Trainers read profiles pending link athletes" ON public.profiles;
CREATE POLICY "Trainers read profiles pending link athletes"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      INNER JOIN public.athlete_link_requests alr ON alr.student_id = s.id
      WHERE s.user_id = profiles.user_id
        AND alr.trainer_id = public.get_trainer_id(auth.uid())
        AND alr.status = 'pending'
    )
  );
