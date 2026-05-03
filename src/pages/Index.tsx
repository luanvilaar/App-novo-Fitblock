import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import logo from "@/assets/logo_fit.png";
import heroImage from "@/assets/crossfit-program.jpg";
import { formatAuthEmailError } from "@/lib/auth-email-errors";

type FormMode = "login" | "signup" | "forgot";

interface BoxOption {
  id: string;
  slug: string;
  name: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<string>("");
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/redirect", { replace: true });
      setPageLoading(false);
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const { data } = await supabase.from("boxes" as any).select("id, slug, name").order("name");
        if (data && Array.isArray(data)) {
          setBoxes(data as unknown as BoxOption[]);
          if (data.length > 0 && !selectedBoxId) setSelectedBoxId((data[0] as any).id);
        }
      } catch { /* boxes table may not exist yet */ }
    };
    loadBoxes();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email.trim() || !password.trim()) { setErrorMessage("Preencha todos os campos"); return; }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) setErrorMessage("Email ou senha inválidos.");
        else if (signInError.message.includes("Email not confirmed")) setErrorMessage("Email não confirmado. Verifique seu email.");
        else setErrorMessage(signInError.message || "Erro ao fazer login");
        toast.error("Falha no login");
        setLoading(false);
        return;
      }
      toast.success("Bem-vindo!");
      await new Promise((r) => setTimeout(r, 600));
      navigate("/redirect", { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao fazer login");
      toast.error("Erro ao fazer login");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!name.trim() || !email.trim() || !password.trim()) { setErrorMessage("Preencha todos os campos"); return; }
    if (password.length < 6) { setErrorMessage("Senha deve ter no mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { name: name.trim(), box_id: selectedBoxId || undefined }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (signUpData.user && selectedBoxId) {
        setTimeout(async () => {
          try {
            await supabase.from("profiles").update({ box_id: selectedBoxId } as any).eq("user_id", signUpData.user!.id);
            await supabase.from("students").update({ box_id: selectedBoxId } as any).eq("user_id", signUpData.user!.id);
          } catch { /* admin can assign */ }
        }, 2000);
      }
      toast.success("Cadastro realizado! Verifique seu email para confirmar.");
      const selectedBox = boxes.find((b) => b.id === selectedBoxId);
      supabase.functions.invoke("notify-admin-new-user", {
        body: { record: { name: name.trim(), email: email.trim(), created_at: new Date().toISOString(), box_name: selectedBox?.name || "" } },
      }).catch(() => {});
      setMode("login"); setEmail(""); setPassword(""); setName("");
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.message?.includes("already registered")) setErrorMessage("Este email já está registrado");
      else setErrorMessage(formatAuthEmailError(err.message) || "Erro ao criar conta");
      toast.error("Erro ao criar conta");
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email.trim()) { setErrorMessage("Digite seu email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      toast.success("Email de recuperação enviado!");
      setMode("login"); setEmail("");
    } catch (err: any) {
      setErrorMessage(formatAuthEmailError(err.message));
      toast.error("Erro ao enviar e-mail");
    } finally { setLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "login") handleLogin(e);
    else if (mode === "signup") handleSignup(e);
    else handleForgot(e);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={heroImage}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,247,244,0.58)_0%,rgba(247,247,244,0.78)_45%,rgba(247,247,244,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(51,33,74,0.1),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(38,37,30,0.08),transparent_34%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="FitBlock Training" className="mb-6 h-28 w-auto object-contain sm:h-32 md:h-36" />
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            FitBlock Training
          </p>
          <h1 className="text-center font-display text-4xl font-normal leading-[0.92] tracking-[-0.06em] text-foreground sm:text-5xl md:text-6xl">
            {mode === "login" ? "Seu treino começa aqui" : mode === "signup" ? "Crie sua conta" : "Recupere o acesso"}
          </h1>
          <p className="mt-3 max-w-sm text-center font-body text-sm leading-relaxed text-muted-foreground">
            {mode === "login"
              ? "Acesse sua plataforma e acompanhe sua rotina de treino em um só lugar."
              : mode === "signup"
                ? "Configure seu acesso e conecte-se à sua unidade em poucos passos."
                : "Digite seu email para receber o link de redefinição de senha."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/92 p-6 backdrop-blur-xl sm:p-8">
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Acesso</span>
              <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                {mode === "login" ? "login" : mode === "signup" ? "cadastro" : "recuperação"}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-4xl font-normal leading-[0.95] tracking-[-0.06em] text-foreground">
                {mode === "login" ? "Entre na plataforma" : mode === "signup" ? "Crie sua conta" : "Recupere o acesso"}
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {mode === "login"
                  ? "Acompanhe treino, progresso e comunicação com o seu coach em uma experiência focada em performance."
                  : mode === "signup"
                    ? "Configure seu acesso e conecte-se à sua unidade para começar a treinar com contexto."
                    : "Digite seu email para receber o link de redefinição de senha."}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs font-medium text-red-600">
                    {errorMessage}
                  </div>
                )}

                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Nome completo</label>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:bg-white"
                    />
                  </div>
                )}

                {mode === "signup" && boxes.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Unidade</label>
                    <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                      <SelectTrigger className="h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:border-primary">
                        <SelectValue placeholder="Selecione sua unidade" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card text-sm text-foreground">
                        {boxes.map((box) => (
                          <SelectItem key={box.id} value={box.id} className="focus:bg-primary/10 focus:text-foreground">
                            {box.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:bg-white"
                  />
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Senha</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot");
                            setErrorMessage("");
                          }}
                          className="text-[10px] uppercase tracking-[0.12em] text-primary transition-colors hover:text-primary/80"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:bg-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-action mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Entrar na plataforma" : mode === "signup" ? "Criar conta" : "Enviar email de recuperação"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setErrorMessage("");
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {mode === "login" ? "Ainda não tem conta? Crie uma agora." : "Já possui conta? Faça login."}
                </button>

                {mode === "login" && (
                  <div className="mt-6 flex flex-col gap-3 border-t border-border/80 pt-6">
                    <button
                      onClick={() => navigate("/registro-treinador")}
                      className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Acesso para Treinadores
                    </button>
                    <Link
                      to="/politicas"
                      className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Termos & Políticas
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
