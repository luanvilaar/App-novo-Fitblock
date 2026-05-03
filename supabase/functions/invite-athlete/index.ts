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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, trainer_id, name } = await req.json();
    if (!email || !trainer_id) {
      return new Response(JSON.stringify({ error: "email and trainer_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for user creation
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      // User exists – just link to trainer
      await adminClient
        .from("students")
        .update({ trainer_id, active: true })
        .eq("user_id", existingProfile.user_id);

      return new Response(
        JSON.stringify({ message: "Atleta existente vinculado ao treinador" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invite new user
    const siteUrl = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".lovable.app");
    const { data: inviteData, error: inviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { name: name || "" },
        redirectTo: `${req.headers.get("origin") || "https://evolve-workout-pro.lovable.app"}/reset-password`,
      });

    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = inviteData.user.id;

    // The handle_new_user trigger creates profile, user_roles, students automatically.
    // We just need to link the student to the trainer.
    // Wait briefly for trigger to execute
    await new Promise((r) => setTimeout(r, 1000));

    await adminClient
      .from("students")
      .update({ trainer_id, active: true })
      .eq("user_id", userId);

    // Update profile name if provided
    if (name) {
      await adminClient
        .from("profiles")
        .update({ name })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({ message: "Convite enviado com sucesso!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
