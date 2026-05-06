import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

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
      "Acesse sua rotina semanal e execute seu treino com foco total.",
    submit: "Entrar na plataforma",
  },
  signup: {
    eyebrow: "Novo atleta",
    title: "Crie seu acesso",
    description:
      "Configure sua conta e comece sua rotina com o coach certo.",
    submit: "Criar minha conta",
  },
  forgot: {
    eyebrow: "Recuperação",
    title: "Receba um novo link",
    description:
      "Digite seu email para redefinir a senha com segurança.",
    submit: "Enviar recuperação",
  },
};

const accessModes: { id: FormMode; label: string }[] = [
  { id: "login", label: "Entrar" },
  { id: "signup", label: "Criar conta" },
  { id: "forgot", label: "Recuperar" },
];

const homeHighlights = [
  "Calendário semanal direto no início",
  "Fluxo de treino limpo, sem distrações",
  "Experiência mobile-first para atleta e coach",
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

        if (!data || !Array.isArray(data)) return;

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
    if (nextMode !== "signup") setName("");
    if (nextMode === "login") setPassword("");
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
          await supabase.from("profiles").update({ box_id: selectedBoxId } as never).eq("user_id", signUpData.user!.id);
          await supabase.from("students").update({ box_id: selectedBoxId } as never).eq("user_id", signUpData.user!.id);
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
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-9 w-9 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 md:px-8 md:py-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-10">
        <section className="rounded-[1.5rem] border border-white/10 bg-black p-6 shadow-[0_4px_16px_rgba(0,0,0,0.16)] md:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">FitBlock Training</p>
          <h1 className="mt-4 font-sans text-4xl font-bold leading-[1.12] md:text-5xl">Treine com foco. Evolua com contexto.</h1>
          <p className="mt-4 max-w-xl text-base text-white/72">
            Plataforma para atletas e coaches gerenciarem rotina semanal de treinos com execução direta e navegação clara.
          </p>

          <div className="mt-7 space-y-3">
            {homeHighlights.map((item) => (
              <div key={item} className="rounded-full border border-white/15 bg-[#111111] px-4 py-3 text-sm text-white/88">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/registro-treinador" className="inline-flex">
              <Button className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-[#e2e2e2]">
                Acesso para Treinadores
              </Button>
            </Link>
            <Link to="/politicas" className="inline-flex">
              <Button variant="outline" className="h-11 rounded-full border-white/25 bg-transparent px-5 text-sm text-white hover:bg-white hover:text-black">
                Termos e Privacidade
              </Button>
            </Link>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white p-6 text-black shadow-[0_4px_16px_rgba(0,0,0,0.16)] md:p-8 lg:p-10">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {accessModes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => resetFieldsForMode(item.id)}
                className={cn(
                  "h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition-all",
                  mode === item.id ? "bg-black text-white" : "bg-[#efefef] text-black hover:bg-[#e2e2e2]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">{copy.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight">{copy.title}</h2>
          <p className="mt-2 text-sm text-[#4b4b4b]">{copy.description}</p>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">
                    Nome completo
                  </Label>
                  <Input
                    id="signup-name"
                    className="h-12 rounded-xl border-black/15 bg-white px-4"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex: João Silva"
                    disabled={loading}
                  />
                </div>
              ) : null}

              {mode === "signup" && boxes.length > 1 ? (
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Unidade</Label>
                  <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                    <SelectTrigger className="h-12 rounded-xl border-black/15 bg-white px-4">
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
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 rounded-xl border-black/15 bg-white px-4"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@exemplo.com"
                  disabled={loading}
                />
              </div>

              {mode !== "forgot" ? (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    className="h-12 rounded-xl border-black/15 bg-white px-4"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              ) : null}

              <Button type="submit" className="h-12 w-full rounded-full bg-black text-sm font-semibold text-white hover:bg-[#1a1a1a]" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {copy.submit}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default Index;
