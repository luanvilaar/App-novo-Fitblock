/**
 * Send Email Hook — envia e-mails de Auth via Resend (API HTTP), contornando falhas de SMTP no GoTrue.
 *
 * Deploy: npx supabase functions deploy auth-send-email --no-verify-jwt
 * Secrets (Dashboard → Edge Functions ou CLI):
 *   RESEND_API_KEY
 *   SEND_EMAIL_HOOK_SECRET  (valor completo ex.: v1,whsec_... vindo de Authentication → Hooks)
 *
 * Depois: Authentication → Hooks → Send Email → URL desta função; copie o secret para SEND_EMAIL_HOOK_SECRET.
 * Opcional: [auth.hook.send_email] em config.toml + npx supabase config push
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
};

const FROM = "FitBlock Training <onboarding@resend.dev>";

type EmailAction =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email"
  | "reauthentication"
  | string;

function projectRefFromUrl(): string {
  const u = Deno.env.get("SUPABASE_URL") || "";
  const m = u.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (!m) throw new Error("SUPABASE_URL inválida na função");
  return m[1];
}

function verifyType(t: EmailAction): string {
  const ok = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];
  if (ok.includes(t)) return t;
  if (t === "reauthentication") return "email";
  return "email";
}

function buildConfirmationUrl(
  ref: string,
  tokenHash: string,
  action: EmailAction,
  redirectTo: string
): string {
  const u = new URL(`https://${ref}.supabase.co/auth/v1/verify`);
  u.searchParams.set("token", tokenHash);
  u.searchParams.set("type", verifyType(action));
  if (redirectTo) u.searchParams.set("redirect_to", redirectTo);
  return u.toString();
}

function subjectFor(action: EmailAction): string {
  switch (action) {
    case "signup":
      return "Bem-vindo à FitBlock — confirme a inscrição";
    case "recovery":
      return "FitBlock — redefinir sua senha";
    case "magiclink":
      return "FitBlock — seu link de acesso";
    case "invite":
      return "FitBlock — convite";
    case "email_change":
    case "email":
      return "FitBlock — confirme seu e-mail";
    case "reauthentication":
      return "FitBlock — código de verificação";
    default:
      return "FitBlock — notificação";
  }
}

function htmlBody(
  action: EmailAction,
  email: string,
  confirmationUrl: string,
  token: string,
  siteUrl: string
): string {
  const safeUrl = confirmationUrl.replace(/"/g, "&quot;");
  
  // Base styles inspired by src/index.css
  const bg = "#f1f0e9"; // off-white
  const primary = "#41226b"; // roxo fitblock
  const text = "#121212";
  const muted = "#666666";
  
  const header = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-family:'Eurostile Extended', 'Montserrat', sans-serif; font-weight: 900; letter-spacing: -0.05em; color: ${text}; margin: 0; text-transform: uppercase;">
        FIT<span style="color: ${primary};">BLOCK</span>
      </h1>
      <p style="font-family:'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: ${muted}; margin: 5px 0 0 0; text-transform: uppercase;">
        Industrial Strength Training
      </p>
    </div>
  `;

  const footer = `
    <div style="text-align: center; margin-top: 40px; font-family:'JetBrains Mono', monospace; font-size: 10px; color: ${muted}; text-transform: uppercase; letter-spacing: 0.1em;">
      &copy; ${new Date().getFullYear()} FITBLOCK TRAINING. All rights reserved.
    </div>
  `;

  if (action === "recovery") {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Montserrat', sans-serif; background-color: ${bg}; color: ${text}; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    ${header}
    
    <div style="background-color: #ffffff; padding: 40px; border: 1px solid rgba(18,18,18,0.1); box-shadow: 10px 10px 0px rgba(65,34,107,0.05);">
      <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${primary}; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid ${bg}; padding-bottom: 15px;">
        Recuperação de Senha
      </h2>
      
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        Recebemos uma solicitação para redefinir a senha da sua conta <strong>${email}</strong>.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${safeUrl}" style="display: inline-block; padding: 18px 36px; background-color: ${primary}; color: #ffffff; text-decoration: none; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: 13px;">
          Redefinir Minha Senha
        </a>
      </div>
      
      <p style="font-size: 13px; color: ${muted}; margin-bottom: 5px;">
        Se o botão acima não funcionar, copie e cole este link:
      </p>
      <p style="font-size: 12px; color: ${primary}; word-break: break-all; margin-top: 0;">
        <a href="${safeUrl}" style="color: ${primary}; text-decoration: underline;">${confirmationUrl}</a>
      </p>
      
      <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid ${bg};">
        <p style="font-size: 12px; color: ${muted}; margin: 0;">
          Código de verificação: <strong style="color: ${text};">${token}</strong>
        </p>
        <p style="font-size: 11px; color: #999; margin-top: 15px;">
          Se você não solicitou esta alteração, por favor ignore este e-mail. Sua senha permanecerá a mesma.
        </p>
      </div>
    </div>
    
    ${footer}
  </div>
</body>
</html>`;
  }

  if (action === "signup" || action === "invite" || action === "email") {
    const title = action === "signup" ? "Bem-vindo ao Time" : action === "invite" ? "Você foi Convidado" : "Confirme seu E-mail";
    const btnText = action === "signup" ? "Confirmar Conta" : action === "invite" ? "Aceitar Convite" : "Confirmar E-mail";

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Montserrat', sans-serif; background-color: ${bg}; color: ${text}; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    ${header}
    
    <div style="background-color: #ffffff; padding: 40px; border: 1px solid rgba(18,18,18,0.1); box-shadow: 10px 10px 0px rgba(65,34,107,0.05);">
      <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${primary}; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid ${bg}; padding-bottom: 15px;">
        ${title}
      </h2>
      
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        Estamos quase lá! Confirme sua conta <strong>${email}</strong> para começar seus treinos na FitBlock.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${safeUrl}" style="display: inline-block; padding: 18px 36px; background-color: ${primary}; color: #ffffff; text-decoration: none; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: 13px;">
          ${btnText}
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid ${bg};">
        <p style="font-size: 11px; color: #999; margin: 0;">
          Este link expira em breve. Se você não reconhece este e-mail, pode ignorá-lo com segurança.
        </p>
      </div>
    </div>
    
    ${footer}
  </div>
</body>
</html>`;
  }

  if (action === "magiclink") {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/></head>
<body style="font-family:'Montserrat', sans-serif; background-color: ${bg}; color: ${text}; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    ${header}
    <div style="background-color: #ffffff; padding: 40px; border: 1px solid rgba(18,18,18,0.1); text-align: center;">
      <a href="${safeUrl}" style="display: inline-block; padding: 18px 36px; background-color: ${primary}; color: #ffffff; text-decoration: none; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: 13px;">
        Entrar na FitBlock
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: ${muted};">Código: ${token}</p>
    </div>
    ${footer}
  </div>
</body>
</html>`;
  }

  return `<p>FitBlock</p><p><a href="${safeUrl}">Continuar</a></p><p>Código: ${token}</p>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";

  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    let user: { email?: string; new_email?: string };
    let email_data: {
      token: string;
      token_hash: string;
      redirect_to: string;
      email_action_type: EmailAction;
      site_url: string;
    };

    if (!hookSecretRaw) {
      return new Response(
        JSON.stringify({ error: "SEND_EMAIL_HOOK_SECRET não configurado na função" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const secret = hookSecretRaw.replace(/^v1,whsec_/, "");
    const wh = new Webhook(secret);
    const verified = wh.verify(payload, headers) as { user: typeof user; email_data: typeof email_data };
    user = verified.user;
    email_data = verified.email_data;

    const ref = projectRefFromUrl();
    const action = email_data.email_action_type;
    const to =
      action === "email_change" && user.new_email ? user.new_email : user.email || "";

    if (!to) {
      return new Response(JSON.stringify({ error: "Sem destinatário" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notificações de segurança: envio simples (evita 500 do Auth)
    if (action.includes("notification")) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: FROM,
          to: [to],
          subject: "FitBlock — alerta de segurança",
          text: `Ação: ${action}. Se não foi você, fale com o suporte.`,
        }),
      });
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const confirmUrl = buildConfirmationUrl(
      ref,
      email_data.token_hash,
      action,
      email_data.redirect_to || ""
    );

    const html = htmlBody(action, to, confirmUrl, email_data.token || "", email_data.site_url || "");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: subjectFor(action),
        html,
      }),
    });

    const j = await emailRes.json();
    if (!emailRes.ok) {
      console.error("Resend:", emailRes.status, j);
      return new Response(JSON.stringify({ error: j }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
