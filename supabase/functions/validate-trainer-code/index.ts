import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { access_code, franchise_unit } = await req.json();

    if (!access_code || !franchise_unit) {
      return new Response(
        JSON.stringify({ error: "Código de acesso e unidade são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Admin client for privileged operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate access code
    const { data: codeData, error: codeErr } = await adminClient
      .from("trainer_access_codes")
      .select("id, code")
      .eq("code", access_code.trim())
      .eq("is_active", true)
      .is("used_by", null)
      .maybeSingle();

    if (codeErr || !codeData) {
      return new Response(
        JSON.stringify({
          error: "Código de acesso inválido ou já utilizado",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Start transaction: mark code as used + create trainer record
    // Mark code as used and increment used_count
    await adminClient
      .from("trainer_access_codes")
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
        used_count: (codeData as any).used_count + 1 || 1
      })
      .eq("id", codeData.id);

    // Generate unique trainer code
    const trainerCode = await generateTrainerCode(adminClient);

    // Check if trainer record exists
    const { data: existingTrainer } = await adminClient
      .from("trainers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingTrainer) {
      // Trainer already exists, just update
      await adminClient
        .from("trainers")
        .update({
          franchise_unit: franchise_unit.trim(),
          trainer_code: trainerCode,
          is_official: true,
          coach_status: "pending", // NEW: Set to pending for admin approval
        })
        .eq("id", existingTrainer.id);
    } else {
      // Create new trainer record
      await adminClient.from("trainers").insert({
        user_id: userId,
        franchise_unit: franchise_unit.trim(),
        trainer_code: trainerCode,
        is_official: true,
        coach_status: "pending", // NEW: Set to pending for admin approval
      });
    }

    // Ensure user has trainer role
    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "trainer")
      .maybeSingle();

    if (!existingRole) {
      await adminClient
        .from("user_roles")
        .insert({ user_id: userId, role: "trainer" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Parabéns! Sua conta de Treinador Oficial FitBlock foi criada! Aguarde a aprovação da administração.",
        trainer_code: trainerCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to generate unique trainer code
async function generateTrainerCode(client: any): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt++) {
    const code =
      "FBT-" +
      chars.charAt(Math.floor(Math.random() * chars.length)) +
      chars.charAt(Math.floor(Math.random() * chars.length)) +
      chars.charAt(Math.floor(Math.random() * chars.length)) +
      chars.charAt(Math.floor(Math.random() * chars.length));

    const { data: existing } = await client
      .from("trainers")
      .select("id")
      .eq("trainer_code", code)
      .maybeSingle();

    if (!existing) {
      return code;
    }
  }

  throw new Error("Não foi possível gerar código único para o treinador");
}
