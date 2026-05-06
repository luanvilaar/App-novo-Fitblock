/**
 * Teste manual: grava 120 kg no exercício Snatch para um atleta e lê de volta.
 * Uso: node scripts/test-student-max-load.mjs
 * Lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do ficheiro .env na raiz.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRootEnv() {
  const envPath = join(__dirname, '..', '.env');
  const raw = readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = loadRootEnv();
const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: exRows, error: exErr } = await supabase
  .from('exercises')
  .select('id, name')
  .ilike('name', 'snatch')
  .limit(5);

if (exErr) {
  console.error('Erro exercises:', exErr.message);
  process.exit(1);
}

const snatch =
  exRows?.find((e) => e.name.toLowerCase() === 'snatch') || exRows?.[0];
if (!snatch) {
  console.error('Nenhum exercício Snatch encontrado na tabela exercises.');
  process.exit(1);
}

const { data: students, error: stErr } = await supabase
  .from('students')
  .select('id')
  .limit(1);

if (stErr) {
  console.error('Erro students:', stErr.message);
  process.exit(1);
}

const student = students?.[0];
if (!student) {
  console.error('Nenhum student na base — crie um atleta para testar.');
  process.exit(1);
}

const payload = {
  student_id: student.id,
  exercise_id: snatch.id,
  max_load: 120,
  unit: 'kg',
  notes: null,
};

const { error: upErr } = await supabase.from('student_max_loads').upsert(payload, {
  onConflict: 'student_id,exercise_id',
});

if (upErr) {
  console.error('Erro upsert student_max_loads:', upErr.message, upErr);
  process.exit(1);
}

const { data: readBack, error: readErr } = await supabase
  .from('student_max_loads')
  .select('max_load, unit, exercise_id, student_id')
  .eq('student_id', student.id)
  .eq('exercise_id', snatch.id)
  .maybeSingle();

if (readErr) {
  console.error('Erro leitura:', readErr.message);
  process.exit(1);
}

const ok =
  readBack &&
  Number(readBack.max_load) === 120 &&
  readBack.unit === 'kg';

console.log(JSON.stringify({ exercise: snatch.name, exercise_id: snatch.id, student_id: student.id, readBack, ok }, null, 2));
process.exit(ok ? 0 : 1);
