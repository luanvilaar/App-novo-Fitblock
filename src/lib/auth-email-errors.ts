/** Mensagens amigáveis para erros de envio de e-mail do Supabase Auth (inglês no backend). */
export function formatAuthEmailError(message: string | undefined): string {
  if (!message) return "Não foi possível enviar o e-mail. Tente novamente.";
  const m = message.trim();
  const map: Record<string, string> = {
    "Error sending recovery email":
      "Não foi possível enviar o e-mail de recuperação. O servidor de e-mail falhou — em breve: hook Resend (veja SUPABASE_SETUP.md) ou reconfigure SMTP no painel Supabase.",
    "Error sending confirmation email":
      "Não foi possível enviar o e-mail de confirmação. Verifique SMTP/Resend no projeto Supabase ou o hook de envio.",
    "Email rate limit exceeded":
      "Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.",
  };
  return map[m] || m;
}
