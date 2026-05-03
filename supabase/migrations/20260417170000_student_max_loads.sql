-- Migration: student_max_loads
-- Tabela para armazenar cargas máximas (1RM) dos atletas por exercício

CREATE TABLE IF NOT EXISTS student_max_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  max_load DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'lb')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, exercise_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_student_max_loads_student ON student_max_loads(student_id);
CREATE INDEX IF NOT EXISTS idx_student_max_loads_exercise ON student_max_loads(exercise_id);

-- RLS (Row Level Security)
ALTER TABLE student_max_loads ENABLE ROW LEVEL SECURITY;

-- Política: Atleta pode ver e editar suas próprias cargas
DROP POLICY IF EXISTS "Students can view own max loads" ON student_max_loads;
CREATE POLICY "Students can view own max loads"
  ON student_max_loads FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert own max loads" ON student_max_loads;
CREATE POLICY "Students can insert own max loads"
  ON student_max_loads FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can update own max loads" ON student_max_loads;
CREATE POLICY "Students can update own max loads"
  ON student_max_loads FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Política: Treinador pode ver cargas dos seus atletas
DROP POLICY IF EXISTS "Trainers can view student max loads" ON student_max_loads;
CREATE POLICY "Trainers can view student max loads"
  ON student_max_loads FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN trainers t ON s.trainer_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

-- Política: Treinador pode editar cargas dos seus atletas
DROP POLICY IF EXISTS "Trainers can manage student max loads" ON student_max_loads;
CREATE POLICY "Trainers can manage student max loads"
  ON student_max_loads FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN trainers t ON s.trainer_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_student_max_loads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_student_max_loads_updated_at ON student_max_loads;
CREATE TRIGGER trigger_student_max_loads_updated_at
  BEFORE UPDATE ON student_max_loads
  FOR EACH ROW
  EXECUTE PROCEDURE update_student_max_loads_updated_at();

-- Comentários
COMMENT ON TABLE student_max_loads IS 'Cargas máximas (1RM) dos atletas por exercício';
COMMENT ON COLUMN student_max_loads.max_load IS 'Carga máxima em kg ou lb';
COMMENT ON COLUMN student_max_loads.unit IS 'Unidade de medida (kg ou lb)';
