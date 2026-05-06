-- FitBlock Training: Athlete-Trainer RBAC Linking System
-- Adds trainer access codes, athlete link requests, and franchise identity

-- Phase 1a: Extend trainers table with franchise unit, trainer code, and official status
ALTER TABLE trainers
  ADD COLUMN IF NOT EXISTS franchise_unit TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trainer_code TEXT UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;

-- Phase 1b: Create trainer_access_codes table
CREATE TABLE IF NOT EXISTS trainer_access_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  used_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 1c: Create athlete_link_requests table
CREATE TABLE IF NOT EXISTS athlete_link_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id   UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  message      TEXT DEFAULT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(student_id, trainer_id)
);

-- Phase 1d: Enable RLS on new tables
ALTER TABLE trainer_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_link_requests ENABLE ROW LEVEL SECURITY;

-- Phase 1e: RLS Policies for trainer_access_codes (admin only)
DROP POLICY IF EXISTS "admin_full_access_codes" ON trainer_access_codes;
CREATE POLICY "admin_full_access_codes" ON trainer_access_codes
  USING (has_role(auth.uid(), 'admin'));

-- Phase 1f: RLS Policies for athlete_link_requests
-- Athlete: can INSERT their own requests
DROP POLICY IF EXISTS "athlete_insert_link_request" ON athlete_link_requests;
CREATE POLICY "athlete_insert_link_request" ON athlete_link_requests FOR INSERT
  WITH CHECK (student_id = get_student_id(auth.uid()));

-- Athlete: can SELECT their own requests
DROP POLICY IF EXISTS "athlete_select_link_request" ON athlete_link_requests;
CREATE POLICY "athlete_select_link_request" ON athlete_link_requests FOR SELECT
  USING (student_id = get_student_id(auth.uid()));

-- Trainer: can SELECT requests sent to them
DROP POLICY IF EXISTS "trainer_select_link_request" ON athlete_link_requests;
CREATE POLICY "trainer_select_link_request" ON athlete_link_requests FOR SELECT
  USING (trainer_id = get_trainer_id(auth.uid()));

-- Trainer: can UPDATE status of requests sent to them
DROP POLICY IF EXISTS "trainer_update_link_request" ON athlete_link_requests;
CREATE POLICY "trainer_update_link_request" ON athlete_link_requests FOR UPDATE
  USING (trainer_id = get_trainer_id(auth.uid()));

-- Phase 1g: RLS on trainers table (allow authenticated users to read for search)
-- First, drop existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "authenticated_read" ON trainers;

-- Add new policy allowing authenticated read (for athlete search)
DROP POLICY IF EXISTS "authenticated_read_trainers" ON trainers;
CREATE POLICY "authenticated_read_trainers" ON trainers FOR SELECT
  TO authenticated USING (TRUE);

-- Phase 1h: Create function to generate unique trainer codes
CREATE OR REPLACE FUNCTION generate_trainer_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  attempt INT := 0;
BEGIN
  WHILE attempt < 10 LOOP
    code := 'FBT-' ||
            substr(chars, floor(random()*length(chars)+1)::int, 1) ||
            substr(chars, floor(random()*length(chars)+1)::int, 1) ||
            substr(chars, floor(random()*length(chars)+1)::int, 1) ||
            substr(chars, floor(random()*length(chars)+1)::int, 1);

    IF NOT EXISTS (SELECT 1 FROM trainers WHERE trainer_code = code) THEN
      RETURN code;
    END IF;

    attempt := attempt + 1;
  END LOOP;

  RAISE EXCEPTION 'Could not generate unique trainer code after 10 attempts';
END;
$$ LANGUAGE plpgsql;

-- Phase 1i: Create notification for trainer when athlete sends link request
CREATE OR REPLACE FUNCTION notify_trainer_link_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, created_at)
    SELECT
      t.user_id,
      'Nova Solicitação de Vínculo',
      'O atleta ' || p.name || ' deseja se vincular a você',
      NOW()
    FROM trainers t
    JOIN profiles p ON p.user_id = (SELECT user_id FROM students WHERE id = NEW.student_id)
    WHERE t.id = NEW.trainer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_link_request_created ON athlete_link_requests;
CREATE TRIGGER on_link_request_created
  AFTER INSERT ON athlete_link_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_trainer_link_request();

-- Phase 1j: Create notification for athlete when request is approved/rejected
CREATE OR REPLACE FUNCTION notify_athlete_link_response()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, title, message, created_at)
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
    FROM students s
    WHERE s.id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_link_request_responded ON athlete_link_requests;
CREATE TRIGGER on_link_request_responded
  AFTER UPDATE ON athlete_link_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_athlete_link_response();
