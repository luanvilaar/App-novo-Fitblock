/**
 * Verifica o fluxo: novo utilizador cliente + linha em students + vínculo trainer_id
 * ao coach já registado (espelha a parte de dados do invite-athlete para utilizador existente).
 *
 * Uso:
 *   node scripts/test-athlete-coach-link-flow.mjs [email-do-coach] [--cleanup]
 *
 * Requer no .env da raiz: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Opcional: TEST_COACH_EMAIL se não passar o email como argumento.
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

const args = process.argv.slice(2).filter((a) => a !== "--cleanup");
const cleanup = process.argv.includes("--cleanup");
const coachEmailArg = args[0];

const env = loadRootEnv();
const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const coachEmail = (coachEmailArg || env.TEST_COACH_EMAIL || "l.vilaar@gmail.com").trim().toLowerCase();

if (!url || !serviceKey) {
  console.error("Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveTrainerIdByCoachEmail(email) {
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("user_id, name")
    .eq("email", email)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile?.user_id) {
    return null;
  }
  const { data: trainer, error: tErr } = await admin
    .from("trainers")
    .select("id, trainer_code, user_id")
    .eq("user_id", profile.user_id)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!trainer) return null;
  return { trainerId: trainer.id, trainerCode: trainer.trainer_code, coachName: profile.name };
}

const athleteEmail = `athlete.flow.${Date.now()}@example.com`;
const athletePassword = "AthleteFlowTest2026!";

console.log("--- FitBlock: teste vínculo atleta ↔ coach ---");
console.log("Coach (email):", coachEmail);
console.log("Atleta (novo):", athleteEmail);

const resolved = await resolveTrainerIdByCoachEmail(coachEmail);
if (!resolved) {
  const { data: sample } = await admin.from("trainers").select("id, user_id, trainer_code").limit(5);
  console.error(
    "\nNão foi encontrado registo em trainers para o email do coach.",
    "Confirme o email ou rode: node scripts/seed-coach-user.mjs\n"
  );
  if (sample?.length) {
    console.error("Alguns trainers na base (user_id):", sample);
  }
  process.exit(1);
}

console.log("Coach resolvido:", resolved.coachName || "(sem nome)", "| trainer_id:", resolved.trainerId);
if (resolved.trainerCode) console.log("Código público do treinador:", resolved.trainerCode);

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: athleteEmail,
  password: athletePassword,
  email_confirm: true,
  user_metadata: { name: "Athlete Flow Test" },
});

if (createErr) {
  console.error("Erro ao criar utilizador atleta:", createErr.message);
  process.exit(1);
}

const athleteUserId = created.user.id;
await new Promise((r) => setTimeout(r, 900));

const { data: studentBefore } = await admin.from("students").select("id, trainer_id, active").eq("user_id", athleteUserId).maybeSingle();
if (!studentBefore) {
  console.error("Trigger handle_new_user não criou students para", athleteUserId);
  await admin.auth.admin.deleteUser(athleteUserId);
  process.exit(1);
}

console.log("\nAntes do vínculo: student_id=", studentBefore.id, "trainer_id=", studentBefore.trainer_id);

const { error: linkErr } = await admin
  .from("students")
  .update({ trainer_id: resolved.trainerId, active: true })
  .eq("user_id", athleteUserId);

if (linkErr) {
  console.error("Erro ao atualizar trainer_id:", linkErr);
  await admin.auth.admin.deleteUser(athleteUserId);
  process.exit(1);
}

const { data: studentAfter } = await admin
  .from("students")
  .select("id, trainer_id, active, box_id")
  .eq("user_id", athleteUserId)
  .single();

const ok = studentAfter?.trainer_id === resolved.trainerId;
console.log("\nDepois do vínculo:", studentAfter);
console.log("\nResultado:", ok ? "PASS — atleta associado ao coach correto." : "FAIL — trainer_id inesperado.");

const anon = createClient(url, env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY);
const { data: sessionData, error: signErr } = await anon.auth.signInWithPassword({
  email: athleteEmail,
  password: athletePassword,
});
if (signErr) {
  console.warn("Login como atleta (opcional):", signErr.message);
} else {
  const uid = sessionData.user.id;
  const { data: selfStudent, error: rsErr } = await anon
    .from("students")
    .select("id, trainer_id")
    .eq("user_id", uid)
    .maybeSingle();
  console.log(
    "Leitura RLS como atleta logado:",
    rsErr ? rsErr.message : selfStudent,
    selfStudent?.trainer_id === resolved.trainerId ? "(trainer_id confere)" : ""
  );
  await anon.auth.signOut();
}

if (cleanup) {
  await admin.auth.admin.deleteUser(athleteUserId);
  console.log("\nUtilizador de teste removido (--cleanup).");
} else {
  console.log("\nConta de teste mantida — email:", athleteEmail, "| senha:", athletePassword);
  console.log("Para repetir e apagar automaticamente, acrescente --cleanup ao comando.");
}

process.exit(ok ? 0 : 1);
