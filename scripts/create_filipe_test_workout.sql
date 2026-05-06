-- =============================================================================
-- PASSO 1 — Rode só isto primeiro e anote o user_id / email que aparecer:
-- =============================================================================
-- SELECT s.id AS student_id, s.trainer_id, s.user_id, p.name, p.email, au.email AS auth_email
-- FROM students s
-- LEFT JOIN profiles p ON p.user_id = s.user_id
-- LEFT JOIN auth.users au ON au.id = s.user_id
-- WHERE p.name ILIKE '%filipe%'
--    OR p.email ILIKE '%filipe%'
--    OR au.email::text ILIKE '%filipe%'
-- ORDER BY p.name;

-- =============================================================================
-- PASSO 2 — Treino de teste (2 exercícios) para o Filipe
-- Ajuste v_target_student se o PASSO 1 mostrar outro student_id.
-- =============================================================================

DO $$
DECLARE
  v_student_id uuid;
  v_trainer_id uuid;
  v_workout_id uuid;
  v_ex1_id uuid;
  v_ex2_id uuid;
  -- Se souber o UUID do aluno na tabela students, coloque aqui (mais confiável):
  v_target_student uuid := NULL; -- ex.: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid;
BEGIN
  IF v_target_student IS NOT NULL THEN
    SELECT s.id, s.trainer_id
    INTO v_student_id, v_trainer_id
    FROM students s
    WHERE s.id = v_target_student;
  ELSE
    -- Busca ampla: perfil OU auth.users; nome estilo "Filipe ... Padua"
    SELECT s.id, s.trainer_id
    INTO v_student_id, v_trainer_id
    FROM students s
    LEFT JOIN profiles p ON p.user_id = s.user_id
    LEFT JOIN auth.users au ON au.id = s.user_id
    WHERE
      -- E-mails comuns (UI costuma mostrar tudo maiúsculo; no banco pode ser outro)
      lower(trim(coalesce(p.email, ''))) IN (
        'filipedepadub@gmail.com',
        'filipedepadua@gmail.com',
        'filipedepaduab@gmail.com'
      )
      OR lower(trim(coalesce(au.email::text, ''))) IN (
        'filipedepadub@gmail.com',
        'filipedepadua@gmail.com',
        'filipedepaduab@gmail.com'
      )
      OR (
        coalesce(p.name, '') ILIKE '%filipe%'
        AND coalesce(p.name, '') ILIKE '%padua%'
      )
      OR (
        coalesce(p.name, '') ILIKE '%filipe%'
        AND (
          coalesce(p.email, '') ILIKE '%gmail%'
          OR coalesce(au.email::text, '') ILIKE '%gmail%'
        )
      )
    ORDER BY s.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION
      'Aluno não encontrado. Rode o SELECT do PASSO 1 (comentário no topo deste arquivo), copie o student_id e defina v_target_student no script.';
  END IF;

  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Aluno sem trainer_id';
  END IF;

  SELECT id INTO v_ex1_id FROM exercises
  WHERE name ILIKE '%back squat%' OR name ILIKE '%agachamento%'
  ORDER BY name LIMIT 1;

  IF v_ex1_id IS NULL THEN
    SELECT id INTO v_ex1_id FROM exercises ORDER BY name LIMIT 1;
  END IF;

  SELECT id INTO v_ex2_id FROM exercises
  WHERE id <> v_ex1_id
  ORDER BY name LIMIT 1;

  IF v_ex1_id IS NULL OR v_ex2_id IS NULL THEN
    RAISE EXCEPTION 'Precisa de pelo menos 2 exercícios cadastrados.';
  END IF;

  INSERT INTO workouts (
    trainer_id, title, category, date, description,
    is_group, group_id, student_id
  ) VALUES (
    v_trainer_id,
    'Teste — 2 exercícios (Filipe)',
    'funcional',
    CURRENT_DATE::text,
    'Criado via scripts/create_filipe_test_workout.sql',
    false,
    null,
    v_student_id
  )
  RETURNING id INTO v_workout_id;

  INSERT INTO workout_exercises (
    workout_id, exercise_id, sets, reps, sort_order,
    suggested_load, notes, block_label, superset_group_id, video_url
  ) VALUES
    (v_workout_id, v_ex1_id, 4, '8', 0, null, null, null, null, null),
    (v_workout_id, v_ex2_id, 3, '10', 1, null, null, null, null, null);

  RAISE NOTICE 'OK — workout_id = %', v_workout_id;
END $$;
