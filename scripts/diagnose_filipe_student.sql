-- Liste candidatos "Filipe" para copiar o student_id correto.
-- Rode no SQL Editor do mesmo projeto do app.

SELECT
  s.id AS student_id,
  s.trainer_id,
  s.user_id,
  s.active,
  p.name AS profile_name,
  p.email AS profile_email,
  au.email AS auth_email
FROM students s
LEFT JOIN profiles p ON p.user_id = s.user_id
LEFT JOIN auth.users au ON au.id = s.user_id
WHERE
  p.name ILIKE '%filipe%'
  OR p.email ILIKE '%filipe%'
  OR au.email::text ILIKE '%filipe%'
ORDER BY p.name NULLS LAST, au.email;
