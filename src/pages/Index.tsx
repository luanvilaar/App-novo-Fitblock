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
    <div className="relative min-h-screen w-full bg-white text-black selection:bg-black selection:text-white">
      {/* Background/Ambient elements - very subtle */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-[#f3f3f3] blur-3xl opacity-50" />
        <div className="absolute -right-[5%] bottom-[5%] h-[30%] w-[30%] rounded-full bg-[#efefef] blur-3xl opacity-30" />
      </div>

      <main className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-12">
          {/* Logo/Brand */}
          <header className="space-y-4 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-lg">
              <span className="font-sans text-3xl font-bold text-white tracking-tighter">FB</span>
            </div>
            <div className="space-y-1">
              <h1 className="font-sans text-4xl font-bold tracking-tight text-black">
                FitBlock
              </h1>
              <p className="text-sm font-medium text-[#4b4b4b]">
                Performance. Sem atalhos.
              </p>
            </div>
          </header>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="font-sans text-2xl font-bold tracking-tight text-black">
                {copy.title}
              </h2>
              <p className="text-sm text-[#4b4b4b]">
                {copy.description}
              </p>
            </div>

            {/* Mode Toggle - Uber Style Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {accessModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => resetFieldsForMode(item.id)}
                  className={cn(
                    "h-10 shrink-0 rounded-full px-5 text-sm font-bold transition-all",
                    mode === item.id
                      ? "bg-black text-white shadow-md"
                      : "bg-[#efefef] text-black hover:bg-[#e2e2e2]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {errorMessage && (
                  <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
                    {errorMessage}
                  </div>
                )}

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-[12px] font-bold uppercase tracking-[1.4px] text-black/40">
                      Nome completo
                    </Label>
                    <Input
                      id="signup-name"
                      className="h-14 rounded-xl border-black/5 bg-[#f3f3f3] px-5 focus:border-black focus:bg-white focus:ring-0"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex: João Silva"
                      disabled={loading}
                    />
                  </div>
                )}

                {mode === "signup" && boxes.length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-[12px] font-bold uppercase tracking-[1.4px] text-black/40">
                      Unidade
                    </Label>
                    <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                      <SelectTrigger className="h-14 rounded-xl border-black/5 bg-[#f3f3f3] px-5 focus:ring-0">
                        <SelectValue placeholder="Selecione sua unidade" />
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
                  <Label htmlFor="email" className="text-[12px] font-bold uppercase tracking-[1.4px] text-black/40">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-14 rounded-xl border-black/5 bg-[#f3f3f3] px-5 focus:border-black focus:bg-white focus:ring-0"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@exemplo.com"
                    disabled={loading}
                  />
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[12px] font-bold uppercase tracking-[1.4px] text-black/40">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-14 rounded-xl border-black/5 bg-[#f3f3f3] px-5 focus:border-black focus:bg-white focus:ring-0"
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
                  className="h-16 w-full text-lg shadow-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      {copy.submit}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            <footer className="space-y-6 pt-6 text-center">
              <div className="flex flex-col gap-3">
                <Link to="/registro-treinador">
                  <Button variant="outline" className="h-12 w-full rounded-full border-black/10 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white">
                    Acesso para Treinadores
                  </Button>
                </Link>
              </div>
              <p className="text-[11px] leading-relaxed text-[#afafaf]">
                Ao continuar, você aceita nossos <Link to="/politicas" className="font-bold text-black underline">Termos</Link> e <Link to="/politicas" className="font-bold text-black underline">Privacidade</Link>.
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
