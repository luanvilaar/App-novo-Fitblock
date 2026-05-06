# Supabase Configuration Guide

## Environment Variables Required

Your project requires the following environment variables to connect to Supabase:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## Local Development

1. Create or update `.env` in your project root:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://kqyzjywdtdfvftvderny.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=kqyzjywdtdfvftvderny
```

3. Restart your dev server:
```bash
npm run dev
```

## Lovable Cloud Deployment

### Option 1: Environment Variables in Dashboard (Recommended)

1. Go to your Lovable Cloud project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these three variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Save and redeploy

### Option 2: Create .env.local in Lovable Cloud

If Option 1 doesn't work, create a `.env.local` file directly in your Lovable Cloud project:

1. In Lovable Cloud editor, create new file: `.env.local`
2. Add your environment variables:
```env
VITE_SUPABASE_URL=https://kqyzjywdtdfvftvderny.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=kqyzjywdtdfvftvderny
```
3. Save and rebuild the project

## Troubleshooting

### Error: "supabaseUrl is required"

1. **Check browser console** (F12) for debug messages showing which variables are missing
2. **Verify variables are configured** in Lovable Cloud settings
3. **Try Option 2** above (create `.env.local` manually)
4. **Hard refresh** browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Variables not loading

- Ensure no spaces around `=` in .env files
- Use full URLs with `https://`
- Check that keys don't have quotes around them
- Wait 30 seconds after saving and try refreshing

## Finding Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_PUBLISHABLE_KEY`

## Auth: e-mails de confirmação e recuperação de senha (Resend + CLI)

1. **Resend:** crie uma API key em [resend.com](https://resend.com) e adicione `RESEND_API_KEY` ao `.env` (ver `.env.example`).
2. **Remetente:** em `supabase/config.toml`, ajuste `admin_email` em `[auth.email.smtp]` para um endereço de um **domínio verificado** no Resend (ou use `onboarding@resend.dev` para testes).
3. **Site URL:** em `[auth]`, mantenha `site_url` e `additional_redirect_urls` alinhados com o URL real da app (ex.: Vercel), para links nos e-mails e redirects de confirmação/recuperação.
4. **Imagens nos e-mails:** o deploy expõe `public/email/hero-bg.jpg` e `fit_logo.png`; os templates usam `{{ .SiteURL }}/email/...` — o **Site URL** do Supabase deve ser a mesma origem onde esses ficheiros existem.
5. **Aplicar ao projeto alojado** (com `supabase link` já feito):

```bash
export RESEND_API_KEY=re_xxxx   # ou: carregue do .env
npx supabase config push
```

Isto envia SMTP + templates (`supabase/templates/confirmation.html` e `recovery.html`) para o projeto ligado. Em alternativa, copie o HTML manualmente para **Dashboard → Authentication → Email Templates**.

### Recuperação de senha / confirmação devolvem 500 (“Error sending recovery email”)

Isto indica falha ao **enviar** o e-mail (GoTrue + SMTP no painel), não um problema do formulário da app. Confirmações:

1. **Resend por API funciona** (chave válida); **SMTP a partir dos servidores do Supabase** pode falhar mesmo com credenciais corretas — nesse caso use o hook abaixo.
2. No **Dashboard → Authentication → URL Configuration**, inclua o URL completo de retorno, por exemplo `https://seu-dominio/reset-password` (além do domínio raiz).
3. **Hook Send Email (recomendado):** já existe a função `auth-send-email`, que envia com a **API Resend** (HTTP), igual ao `notify-admin-new-user`.
   - **Dashboard → Authentication → Hooks → Send Email (Hook)**  
   - URL: `https://<project_ref>.supabase.co/functions/v1/auth-send-email`  
     (ex.: `https://eqqznfijpxckfqqttabm.supabase.co/functions/v1/auth-send-email`)
   - Copie o **signing secret** do hook e grave-o como secret da Edge Function:  
     `npx supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_..." --project-ref <project_ref>`
   - Garanta `RESEND_API_KEY` nos secrets do projeto (`npx supabase secrets set RESEND_API_KEY=...`).
   - Com o hook **ativo**, o Auth deixa de depender do SMTP para esses envios.

Opcionalmente pode espelhar o hook em `config.toml` (`[auth.hook.send_email]`) e correr `npx supabase config push`.

## Security Notes

- ✅ `.env` is in `.gitignore` - credentials won't be committed
- ✅ `.env.example` documents required variables
- ✅ Only use **public/anon keys**, never the service_role key in frontend code
- ✅ Lovable Cloud has its own separate environment variables
