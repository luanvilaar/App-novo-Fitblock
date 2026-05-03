/**
 * Cria (ou atualiza) uma conta Auth e promove a coach (trainer): user_roles + trainers.
 * Uso: node scripts/seed-coach-user.mjs
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env da raiz.
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

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomTrainerCode() {
  let s = "FBT-";
  for (let i = 0; i < 4; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

async function uniqueTrainerCode(supabase) {
  for (let a = 0; a < 15; a++) {
    const code = randomTrainerCode();
    const { data } = await supabase.from("trainers").select("id").eq("trainer_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Não foi possível gerar trainer_code único");
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

const EMAIL = process.argv[2] || "l.vilaar@gmail.com";
const PASSWORD = process.argv[3] || "FitblockCoach2026!";
const DISPLAY_NAME = process.argv[4] || "Luan Vilaar";

if (!url || !serviceKey) {
  console.error("Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { name: DISPLAY_NAME },
});

let userId;

if (createErr) {
  const msg = createErr.message || "";
  if (msg.includes("already been registered") || msg.includes("already registered")) {
    userId = await findUserIdByEmail(supabase, EMAIL);
    if (!userId) {
      console.error("Utilizador existe mas não foi encontrado na listagem:", createErr);
      process.exit(1);
    }
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: DISPLAY_NAME },
    });
    if (updErr) {
      console.error("Erro ao atualizar utilizador:", updErr);
      process.exit(1);
    }
    console.log("Conta já existia; palavra-passe e email confirmado atualizados.");
  } else {
    console.error("Erro ao criar utilizador:", createErr);
    process.exit(1);
  }
} else {
  userId = created.user.id;
  console.log("Conta Auth criada.");
}

await new Promise((r) => setTimeout(r, 800));

const { data: roleRow } = await supabase
  .from("user_roles")
  .select("id")
  .eq("user_id", userId)
  .eq("role", "trainer")
  .maybeSingle();

if (!roleRow) {
  const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: userId, role: "trainer" });
  if (roleErr) {
    console.error("Erro ao inserir role trainer:", roleErr);
    process.exit(1);
  }
  console.log("Role trainer adicionada.");
} else {
  console.log("Role trainer já existia.");
}

const { data: trainerRow } = await supabase.from("trainers").select("id, trainer_code").eq("user_id", userId).maybeSingle();

const code = trainerRow?.trainer_code || (await uniqueTrainerCode(supabase));

if (!trainerRow) {
  const { error: tErr } = await supabase.from("trainers").insert({
    user_id: userId,
    franchise_unit: "FitBlock Dev",
    trainer_code: code,
    is_official: true,
    coach_status: "approved",
  });
  if (tErr) {
    console.error("Erro ao inserir trainers:", tErr);
    process.exit(1);
  }
  console.log("Registo trainers criado, código:", code);
} else {
  const { error: tErr } = await supabase
    .from("trainers")
    .update({
      franchise_unit: "FitBlock Dev",
      trainer_code: trainerRow.trainer_code || code,
      is_official: true,
      coach_status: "approved",
    })
    .eq("id", trainerRow.id);
  if (tErr) {
    console.error("Erro ao atualizar trainers:", tErr);
    process.exit(1);
  }
  console.log("Registo trainers atualizado, código:", trainerRow.trainer_code || code);
}

console.log("\n---");
console.log("Email:", EMAIL);
console.log("Senha:", PASSWORD);
console.log("user_id:", userId);
console.log("---\nPode fazer login na app (fluxo coach → /trainer).");
