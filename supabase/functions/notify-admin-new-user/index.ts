import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    if (!ADMIN_EMAIL) {
      throw new Error("ADMIN_NOTIFICATION_EMAIL is not configured");
    }

    const payload = await req.json();
    const record = payload.record || payload;

    const userName = record.name || "Não informado";
    const userEmail = record.email || "Não informado";
    const createdAt = record.created_at
      ? new Date(record.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Determine user type - new signups are always "Atleta" (cliente role)
    const userType = "Atleta";

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FitBlock <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🆕 Nova conta criada — ${userName}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
            <h2 style="color: #a78bfa; margin-bottom: 24px;">Nova conta criada no FitBlock</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Nome:</td>
                <td style="padding: 8px 0; font-weight: 600;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">E-mail:</td>
                <td style="padding: 8px 0; font-weight: 600;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Tipo:</td>
                <td style="padding: 8px 0; font-weight: 600;">${userType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Data:</td>
                <td style="padding: 8px 0; font-weight: 600;">${createdAt}</td>
              </tr>
            </table>
            <hr style="border: 1px solid #1f1f1f; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 12px;">FitBlock Training — Notificação automática</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      throw new Error(`Resend API error [${emailRes.status}]: ${JSON.stringify(emailData)}`);
    }

    console.log("Admin notification sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error sending admin notification:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
