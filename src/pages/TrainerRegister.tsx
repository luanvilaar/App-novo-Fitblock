import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, KeyRound, Loader2, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo_fit.png";
import heroImage from "@/assets/crossfit-program.jpg";

const TrainerRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [franchiseUnit, setFranchiseUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/redirect", { replace: true });
        return;
      }
      setPageLoading(false);
    });
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword || !accessCode.trim() || !franchiseUnit.trim()) {
      setErrorMessage("Preencha todos os campos para continuar.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "validate-trainer-code",
        {
          body: {
            access_code: accessCode.trim().toUpperCase(),
            franchise_unit: franchiseUnit.trim(),
          },
        },
      );

      if (fnError || !result?.success) {
        setErrorMessage(
          result?.message || "Código não reconhecido. Verifique com a sua franquia FitBlock.",
        );
        toast.error("Falha na validação do código");
        setLoading(false);
        return;
      }

      toast.success("Cadastro oficial concluído.");
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate("/redirect");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível concluir o cadastro.";
      if (message.includes("duplicate") || message.includes("already registered")) {
        setErrorMessage("Este email já está registrado.");
      } else {
        setErrorMessage(message);
      }
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-[0.16] saturate-0" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.72),rgba(18,18,18,0.98)_52%,rgba(18,18,18,1)_100%)]" />
      </div>

      <div className="relative z-10 min-h-screen px-safe pt-safe pb-safe">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center py-8">
          <div className="split-layout w-full items-stretch gap-4 lg:gap-6">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="card-terminal flex flex-col justify-between rounded-[32px] p-6 sm:p-8 lg:p-10"
            >
              <div className="space-y-8">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  voltar ao acesso principal
                </Link>

                <div className="flex items-center gap-3">
                  <img src={logo} alt="FitBlock Training" className="h-14 w-auto object-contain" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                      treinador oficial
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Área dedicada a coaches aprovados pela operação FitBlock.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-xl font-display text-4xl leading-[0.94] sm:text-5xl lg:text-6xl">
                    Cadastro premium com validação da franquia.
                  </h1>
                  <p className="max-w-xl text-sm leading-relaxed text-text-soft sm:text-base">
                    Ative seu acesso de treinador, valide o código oficial da unidade e entre
                    no painel com tudo pronto para prescrição e acompanhamento.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="app-surface-soft rounded-[24px] p-4">
                    <BadgeCheck className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-foreground">Fluxo validado por código e unidade.</p>
                  </div>
                  <div className="app-surface-soft rounded-[24px] p-4">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-foreground">Credencial exclusiva para treinadores oficiais.</p>
                  </div>
                  <div className="app-surface-soft rounded-[24px] p-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-foreground">Liberação segura antes do acesso ao painel.</p>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
              className="card-premium rounded-[32px] p-5 sm:p-7 lg:p-8"
            >
              <div className="mb-6 space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  validação de treinador
                </p>
                <h2 className="font-display text-3xl leading-[0.96] sm:text-4xl">
                  Solicite seu acesso oficial
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  Preencha seus dados, confirme a senha e informe o código de acesso da sua unidade.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="trainer-name" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Nome completo
                  </Label>
                  <Input
                    id="trainer-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainer-email" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="trainer-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="coach@fitblock.com"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trainer-password" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Senha
                    </Label>
                    <Input
                      id="trainer-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-password-confirm" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Confirmar senha
                    </Label>
                    <Input
                      id="trainer-password-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trainer-access-code" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Código de acesso
                    </Label>
                    <Input
                      id="trainer-access-code"
                      value={accessCode}
                      onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                      placeholder="FBK-XXXX-XX"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-franchise-unit" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Unidade
                    </Label>
                    <Input
                      id="trainer-franchise-unit"
                      value={franchiseUnit}
                      onChange={(event) => setFranchiseUnit(event.target.value)}
                      placeholder="Ex.: Moema"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary-pill"
                  size="xl"
                  className="mt-2 w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      validando cadastro
                    </>
                  ) : (
                    <>
                      concluir cadastro oficial
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerRegister;
