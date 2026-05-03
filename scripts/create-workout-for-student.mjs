/**
 * Cria um treino simples (1 exercício do catálogo) para um aluno pelo nome no perfil
 * ou pelo email (--email).
 *
 * Uso:
 *   node scripts/create-workout-for-student.mjs Gabriela [emailTreinadorOpcional]
 *   node scripts/create-workout-for-student.mjs --email aluna@mail.com [emailTreinadorOpcional]
 *
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env da raiz.
 * Se o aluno não tiver trainer_id, passa o email do treinador para preencher o vínculo.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRootEnv() {
  const envPath = join(__dirname, "..", ".env");
  const raw = readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
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

async function findUserIdByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) return u.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

const env = loadRootEnv();
const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const rawArgs = process.argv.slice(2);
let NAME_QUERY = "Gabriela";
let STUDENT_EMAIL = "";
let TRAINER_EMAIL = "";

if (rawArgs[0] === "--email" && rawArgs[1]) {
  STUDENT_EMAIL = rawArgs[1];
  TRAINER_EMAIL = rawArgs[2] || "";
} else {
  NAME_QUERY = rawArgs[0] || "Gabriela";
  TRAINER_EMAIL = rawArgs[1] || "";
}

if (!url || !serviceKey) {
  console.error("Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const today = new Date().toISOString().slice(0, 10);

let profile;

if (STUDENT_EMAIL) {
  const userId = await findUserIdByEmail(supabase, STUDENT_EMAIL);
  if (!userId) {
    console.error("Nenhum utilizador Auth com email:", STUDENT_EMAIL);
    process.exit(1);
  }
  const { data: prof, error: profErr } = await supabase.from("profiles").select("user_id, name").eq("user_id", userId).maybeSingle();
  if (profErr || !prof) {
    console.error("Perfil não encontrado para este email.");
    process.exit(1);
  }
  profile = prof;
  console.log("Alvo (email):", STUDENT_EMAIL, "|", profile.name, "| user_id:", profile.user_id);
} else {
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("user_id, name")
    .ilike("name", `%${NAME_QUERY}%`);

  if (pErr) {
    console.error("Erro ao buscar perfis:", pErr);
    process.exit(1);
  }

  if (!profiles?.length) {
    console.error(`Nenhum perfil encontrado com nome contendo "${NAME_QUERY}".`);
    console.error("Dica: use --email aluna@exemplo.com ou crie o aluno e o nome em /perfil.");
    process.exit(1);
  }

  if (profiles.length > 1) {
    console.log("Vários perfis; usando o primeiro. Lista:");
    profiles.forEach((p) => console.log(" -", p.name, p.user_id));
  }

  profile = profiles[0];
  console.log("Alvo:", profile.name, "| user_id:", profile.user_id);
}

const { data: student, error: sErr } = await supabase
  .from("students")
  .select("id, trainer_id, active")
  .eq("user_id", profile.user_id)
  .maybeSingle();

if (sErr) {
  console.error("Erro ao buscar student:", sErr);
  process.exit(1);
}

if (!student) {
  console.error("Não existe registo em students para este utilizador.");
  process.exit(1);
}

let trainerId = student.trainer_id;

if (!trainerId) {
  if (!TRAINER_EMAIL) {
    console.error(
      'Aluno sem trainer_id. Execute de novo com o email do treinador:\n  node scripts/create-workout-for-student.mjs "' +
        NAME_QUERY +
        '" seu-coach@email.com',
    );
    process.exit(1);
  }
  const tidUid = await findUserIdByEmail(supabase, TRAINER_EMAIL);
  if (!tidUid) {
    console.error("Treinador não encontrado:", TRAINER_EMAIL);
    process.exit(1);
  }
  const { data: tr, error: tErr } = await supabase.from("trainers").select("id").eq("user_id", tidUid).maybeSingle();
  if (tErr || !tr) {
    console.error("Registo trainers não encontrado para este email.");
    process.exit(1);
  }
  trainerId = tr.id;
  const { error: upErr } = await supabase.from("students").update({ trainer_id: trainerId, active: true }).eq("id", student.id);
  if (upErr) {
    console.error("Erro ao atualizar trainer_id do aluno:", upErr);
    process.exit(1);
  }
  console.log("Aluno vinculado ao treinador", TRAINER_EMAIL);
}

const { data: exercise, error: exErr } = await supabase.from("exercises").select("id, name").limit(1).maybeSingle();
if (exErr || !exercise) {
  console.error("Não foi possível obter um exercício do catálogo (tabela exercises vazia?).", exErr);
  process.exit(1);
}

const title = `Treino teste — ${profile.name.split(" ")[0]}`;

const { data: workout, error: wErr } = await supabase
  .from("workouts")
  .insert({
    trainer_id: trainerId,
    student_id: student.id,
    title,
    category: "funcional",
    date: today,
    description: "Criado por scripts/create-workout-for-student.mjs",
    is_group: false,
    group_id: null,
  })
  .select("id")
  .single();

if (wErr) {
  console.error("Erro ao criar workout:", wErr);
  process.exit(1);
}

const { error: weErr } = await supabase.from("workout_exercises").insert({
  workout_id: workout.id,
  exercise_id: exercise.id,
  sets: 3,
  reps: "12",
  suggested_load: null,
  notes: null,
  sort_order: 0,
});

if (weErr) {
  console.error("Erro ao inserir exercício no treino:", weErr);
  await supabase.from("workouts").delete().eq("id", workout.id);
  process.exit(1);
}

console.log("\n---");
console.log("Treino criado:", title);
console.log("workout_id:", workout.id);
console.log("Exercício:", exercise.name);
console.log("Data:", today);
console.log("student_id:", student.id);
console.log("---\nAbra /trainer/atletas/" + student.id + "/treinos no painel do treinador.");
