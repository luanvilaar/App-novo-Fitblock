import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Dumbbell,
  Loader2,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatAuthEmailError } from "@/lib/auth-email-errors";
import { toast } from "sonner";
import logo from "@/assets/logo_fit.png";
import heroImage from "@/assets/crossfit-program.jpg";

type FormMode = "login" | "signup" | "forgot";

interface BoxOption {
  id: string;
  slug: string;
  name: string;
}

const modeCopy: Record<
  FormMode,
  { eyebrow: string; title: string; description: string; submit: string }
> = {
  login: {
    eyebrow: "Acesso FitBlock",
    title: "Entre no seu treino",
    description:
      "Acesse sua rotina, acompanhe a evolução e responda ao seu coach em uma interface pensada para celular.",
    submit: "Entrar na plataforma",
  },
  signup: {
    eyebrow: "Novo atleta",
    title: "Crie seu acesso",
    description:
      "Configure sua conta, selecione sua unidade e comece a treinar com contexto desde o primeiro login.",
    submit: "Criar minha conta",
  },
  forgot: {
    eyebrow: "Recuperação",
    title: "Receba um novo link",
    description:
      "Digite seu email para redefinir a senha e voltar para o app com segurança.",
    submit: "Enviar recuperação",
  },
};

const accessModes: { id: FormMode; label: string }[] = [
  { id: "login", label: "Entrar" },
  { id: "signup", label: "Criar conta" },
  { id: "forgot", label: "Recuperar" },
];

const heroStats = [
  { value: "100%", label: "mobile first" },
  { value: "coach", label: "prescrição rápida" },
  { value: "athlete", label: "execução clara" },
];

const featureBullets = [
  "Treino do dia com execução orientada",
  "Acompanhamento de progresso e histórico",
  "Comunicação direta entre atleta e coach",
];

const Index = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState("");
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const copy = useMemo(() => modeCopy[mode], [mode]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/redirect", { replace: true });
        return;
      }
      setPageLoading(false);
    };

    void checkSession();
  }, [navigate]);

  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const { data } = await supabase
          .from("boxes" as never)
          .select("id, slug, name")
          .order("name");

        if (!data || !Array.isArray(data)) {
          return;
        }

        setBoxes(data as unknown as BoxOption[]);
        if (!selectedBoxId && data.length > 0) {
          setSelectedBoxId((data[0] as { id: string }).id);
        }
      } catch {
        // Optional table in some environments.
      }
    };

    void loadBoxes();
  }, [selectedBoxId]);

  const resetFieldsForMode = (nextMode: FormMode) => {
    setMode(nextMode);
    setErrorMessage("");
    if (nextMode !== "signup") {
      setName("");
    }
    if (nextMode === "login") {
      setPassword("");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha email e senha para continuar.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setErrorMessage("Email ou senha inválidos.");
      } else if (error.message.includes("Email not confirmed")) {
        setErrorMessage("Seu email ainda não foi confirmado.");
      } else {
        setErrorMessage(error.message || "Não foi possível entrar.");
      }
      toast.error("Falha no login");
      return;
    }

    toast.success("Bem-vindo de volta.");
    await new Promise((resolve) => setTimeout(resolve, 500));
    navigate("/redirect", { replace: true });
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Preencha todos os campos para criar sua conta.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          box_id: selectedBoxId || undefined,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message?.includes("duplicate") || error.message?.includes("already registered")) {
        setErrorMessage("Este email já está registrado.");
      } else {
        setErrorMessage(formatAuthEmailError(error.message) || "Não foi possível criar a conta.");
      }
      toast.error("Erro ao criar conta");
      return;
    }

    if (signUpData.user && selectedBoxId) {
      setTimeout(async () => {
        try {
          await supabase
            .from("profiles")
            .update({ box_id: selectedBoxId } as never)
            .eq("user_id", signUpData.user!.id);
          await supabase
            .from("students")
            .update({ box_id: selectedBoxId } as never)
            .eq("user_id", signUpData.user!.id);
        } catch {
          // Non-critical fallback.
        }
      }, 2000);
    }

    const selectedBox = boxes.find((box) => box.id === selectedBoxId);
    void supabase.functions
      .invoke("notify-admin-new-user", {
        body: {
          record: {
            name: name.trim(),
            email: email.trim(),
            created_at: new Date().toISOString(),
            box_name: selectedBox?.name || "",
          },
        },
      })
      .catch(() => undefined);

    toast.success("Conta criada. Verifique seu email para confirmar o acesso.");
    setEmail("");
    setPassword("");
    setName("");
    setErrorMessage("");
    setMode("login");
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setErrorMessage("Digite seu email para receber o link.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(formatAuthEmailError(error.message));
      toast.error("Erro ao enviar recuperação");
      return;
    }

    toast.success("Link de recuperação enviado.");
    setMode("login");
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (mode === "login") {
        await handleLogin();
      } else if (mode === "signup") {
        await handleSignup();
      } else {
        await handleForgot();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado.";
      setErrorMessage(message);
      toast.error(message);
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
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover opacity-[0.22] saturate-0"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.6),rgba(18,18,18,0.96)_48%,rgba(18,18,18,1)_100%)]" />
      </div>

      <div className="relative z-10 min-h-screen px-safe pt-safe pb-safe">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center py-8">
          <div className="split-layout w-full items-stretch gap-4 lg:gap-6">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="card-terminal flex flex-col justify-between overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-10"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={logo} alt="FitBlock Training" className="h-14 w-auto object-contain" />
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                        FitBlock Training
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mobile app experience para treino, coach e execução.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex h-11 items-center rounded-full border border-primary/25 bg-primary/10 px-4 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    v mobile
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-soft">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    acesso rápido para coach e atleta
                  </div>
                  <h1 className="max-w-xl font-display text-4xl leading-[0.94] text-foreground sm:text-5xl lg:text-6xl">
                    O treino começa no celular e continua no resultado.
                  </h1>
                  <p className="max-w-xl text-sm leading-relaxed text-text-soft sm:text-base">
                    Uma experiência compacta, escura e orientada à ação para prescrição,
                    execução e evolução diária no FitBlock.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {heroStats.map((item) => (
                    <div key={item.label} className="app-surface-soft rounded-[24px] p-4">
                      <p className="font-display text-2xl text-foreground">{item.value}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="app-surface-soft rounded-[24px] p-4">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-foreground">Navegação pensada para uma mão.</p>
                  </div>
                  <div className="app-surface-soft rounded-[24px] p-4">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-foreground">Treino do dia, progresso e histórico sem ruído.</p>
                  </div>
                  <div className="app-surface-soft rounded-[24px] p-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-foreground">Acesso seguro com fluxo de recuperação integrado.</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {featureBullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-3 text-sm text-text-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
              className="card-premium flex flex-col justify-between rounded-[32px] p-5 sm:p-7 lg:p-8"
            >
              <div>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    {copy.eyebrow}
                  </p>
                  <Link
                    to="/politicas"
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    Privacidade
                  </Link>
                </div>

                <div className="mb-6 space-y-2">
                  <h2 className="font-display text-3xl leading-[0.96] text-foreground sm:text-4xl">
                    {copy.title}
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                    {copy.description}
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-2 rounded-full border border-border bg-secondary p-1">
                  {accessModes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => resetFieldsForMode(item.id)}
                      className={cn(
                        "h-11 rounded-full px-2 text-[10px] font-bold uppercase tracking-[1.4px] transition-all",
                        mode === item.id
                          ? "bg-primary text-primary-foreground shadow-medium"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={mode}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {errorMessage && (
                      <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                      </div>
                    )}

                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                          Nome completo
                        </Label>
                        <Input
                          id="signup-name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Seu nome"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {mode === "signup" && boxes.length > 1 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                          Unidade
                        </Label>
                        <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a sua unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {boxes.map((box) => (
                              <SelectItem key={box.id} value={box.id}>
                                {box.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="voce@fitblock.com"
                        disabled={loading}
                      />
                    </div>

                    {mode !== "forgot" && (
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                          Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                        />
                      </div>
                    )}

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
                          processando
                        </>
                      ) : (
                        <>
                          {copy.submit}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                </AnimatePresence>
              </div>

              <div className="mt-8 space-y-4 border-t border-border pt-5">
                <div className="flex flex-wrap gap-3">
                  <Link to="/registro-treinador" className="flex-1 min-w-[180px]">
                    <Button variant="secondary-pill" className="w-full">
                      Cadastro de treinador
                    </Button>
                  </Link>
                  <Link to="/politicas" className="flex-1 min-w-[150px]">
                    <Button variant="ghost-pill" className="w-full">
                      Termos e privacidade
                    </Button>
                  </Link>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Ao continuar, você acessa uma experiência focada em treino,
                  progresso e comunicação com seu coach, com uso principal em celular.
                </p>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
