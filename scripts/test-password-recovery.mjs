/**
 * Testa POST de recuperação de senha (mesmo fluxo do browser).
 * Uso: node scripts/test-password-recovery.mjs seu@email.com [redirectTo]
 * Lê SUPABASE_URL e SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY) do .env
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = loadRootEnv();
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

const email = process.argv[2];
const redirectTo =
  process.argv[3] || "https://fitblock-eta.vercel.app/reset-password";

if (!url || !anon) {
  console.error("Falta SUPABASE_URL/VITE_SUPABASE_URL ou chave anon no .env");
  process.exit(1);
}
if (!email) {
  console.error("Uso: node scripts/test-password-recovery.mjs <email> [redirectTo]");
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

if (error) {
  console.error("Erro:", error.message);
  console.error("Código:", error.status || error.code || "—");
  process.exit(1);
}

console.log("OK: pedido aceite pelo Auth (verifique inbox / spam e logs Resend).");
console.log("redirectTo usado:", redirectTo);
