/**
 * Cria (ou atualiza) conta Auth de aluno: apenas role cliente + student (via trigger ou verificação).
 * Remove role trainer/trainers neste utilizador se existirem (conta “só aluno”).
 * Uso: node scripts/seed-student-user.mjs [email] [senha] [nome]
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

const EMAIL = process.argv[2] || "luanvilaar@gmail.com";
const PASSWORD = process.argv[3] || "FitblockAluno2026!";
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
  console.log("Conta Auth criada (trigger deve criar profile, cliente, student).");
}

await new Promise((r) => setTimeout(r, 1000));

await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "trainer");
await supabase.from("trainers").delete().eq("user_id", userId);

const { data: clienteRole } = await supabase
  .from("user_roles")
  .select("id")
  .eq("user_id", userId)
  .eq("role", "cliente")
  .maybeSingle();

if (!clienteRole) {
  const { error: rErr } = await supabase.from("user_roles").insert({ user_id: userId, role: "cliente" });
  if (rErr) {
    console.error("Erro ao inserir role cliente:", rErr);
    process.exit(1);
  }
  console.log("Role cliente adicionada.");
}

const { data: stu } = await supabase.from("students").select("id").eq("user_id", userId).maybeSingle();
if (!stu) {
  const { error: sErr } = await supabase.from("students").insert({ user_id: userId });
  if (sErr) {
    console.error("Erro ao inserir students:", sErr);
    process.exit(1);
  }
  console.log("Registo students criado.");
} else {
  console.log("Registo students já existia.");
}

console.log("\n---");
console.log("Email:", EMAIL);
console.log("Senha:", PASSWORD);
console.log("user_id:", userId);
console.log("---\nLogin na app → /dashboard (aluno).");
