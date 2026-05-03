-- Metcon scores e ranking visíveis entre atletas do mesmo grupo (motivação / leaderboard).
-- group_members só expõe a própria linha ao aluno; por isso usamos função SECURITY DEFINER
-- para testar partilha de grupo sem expor memberships alheios via SELECT direto.

CREATE OR REPLACE FUNCTION public.student_shares_group_with(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _a IS NOT NULL
    AND _b IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.group_members gm_a
      INNER JOIN public.group_members gm_b ON gm_b.group_id = gm_a.group_id
      WHERE gm_a.student_id = _a
        AND gm_b.student_id = _b
    );
$$;

GRANT EXECUTE ON FUNCTION public.student_shares_group_with(uuid, uuid) TO authenticated;

-- Ler scores de metcon de colegas do mesmo grupo (além do próprio)
CREATE POLICY "Students read group peer metcon scores"
  ON public.metcon_scores
  FOR SELECT
  TO authenticated
  USING (
    public.student_shares_group_with(public.get_student_id(auth.uid()), metcon_scores.student_id)
  );

-- Resolver id → user_id de colegas para o ranking
CREATE POLICY "Students read group peers student rows"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    public.student_shares_group_with(public.get_student_id(auth.uid()), students.id)
  );

-- Nomes no ranking (profiles)
CREATE POLICY "Students read peer profiles in shared groups"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.user_id = profiles.user_id
        AND public.student_shares_group_with(public.get_student_id(auth.uid()), s.id)
    )
  );
