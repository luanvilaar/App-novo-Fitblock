import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatAuthEmailError } from "@/lib/auth-email-errors";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Trophy, AlertCircle } from "lucide-react";
import logo from "@/assets/logo_fit.png";

type FormMode = "login" | "forgot";

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/redirect", { replace: true });
      }
      setPageLoading(false);
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setErrorMessage("Email ou senha inválidos.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setErrorMessage("Email não confirmado. Verifique seu email.");
        } else {
          setErrorMessage(signInError.message || "Erro ao fazer login");
        }
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
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email.trim()) {
      setErrorMessage("Digite seu email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de recuperação enviado!");
      setMode("login");
      setEmail("");
    } catch (err: any) {
      setErrorMessage(formatAuthEmailError(err.message));
      toast.error("Erro ao enviar e-mail");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden selection:bg-primary selection:text-white">
      {/* ── Background Layer ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=2800&q=80" 
          alt="FitBlock Industrial" 
          className="w-full h-full object-cover opacity-30 grayscale mix-blend-luminosity scale-110 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]" style={{ background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 2px, 3px 100%" }} />
      </div>

      {/* ── Login Interface ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-20"
      >
        {/* Header Decor */}
        <div className="flex flex-col items-center mb-10 space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <img src={logo} alt="FitBlock" className="h-40 w-auto object-contain relative z-10 brightness-110 drop-shadow-[0_0_30px_rgba(51,33,74,0.22)]" />
          </motion.div>
          
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-primary font-bold whitespace-nowrap">
              AUTH_SEQUENCE_L01
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>

        {/* Auth Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent clip-cut-corner-lg opacity-50" />
          <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl p-10 relative clip-cut-corner-lg border border-white/5 space-y-10">
            
            <div className="space-y-2">
              <h1 className="font-display text-4xl uppercase tracking-tighter text-white leading-none">
                {mode === "login" ? "Acessar" : "Recuperar"} <span className="text-primary italic">Sistema</span>
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground border-l border-primary/40 pl-3">
                {mode === "login" 
                  ? "INICIALIZANDO PROTOCOLO DE AUTENTICAÇÃO CENTRAL" 
                  : "DISPARO DE TRANSMISSÃO PARA RECUPERAÇÃO DE ACESSO"}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-4 clip-cut-corner-sm"
              >
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="font-mono text-[10px] text-destructive uppercase tracking-widest leading-relaxed">
                  ERROR_LOG: {errorMessage}
                </p>
              </motion.div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Network_Identity (Email)</Label>
                  <Input
                    type="email"
                    placeholder="ID@FITBLOCK.COM"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase rounded-none outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">Access_Key (Senha)</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMessage("");
                      }}
                      className="font-mono text-[8px] uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-colors"
                    >
                      FORGOT_PASS?
                    </button>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase rounded-none outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-white text-black font-display-wide font-extrabold uppercase text-xs hover:bg-white/90 transition-all flex items-center justify-between px-8 group/btn disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      PROCESSANDO_AUTH
                    </>
                  ) : (
                    <>
                      <span>EFETIVAR_LOGIN</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgot} className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Network_Identity (Email)</Label>
                  <Input
                    type="email"
                    placeholder="ID@FITBLOCK.COM"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase rounded-none outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-primary text-white font-display font-bold uppercase tracking-[0.2em] text-sm clip-cut-corner-sm hover:brightness-110 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      RECOVERY_SENDING
                    </>
                  ) : (
                    "DISPARAR RECOVERY_LINK"
                  )}
                </button>

                <button
                  type="button"
                  className="w-full h-14 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 font-mono text-[9px] uppercase tracking-widest transition-all clip-cut-corner-sm"
                  onClick={() => {
                    setMode("login");
                    setEmail("");
                    setErrorMessage("");
                  }}
                >
                  ABORTAR_E_VOLTAR
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {mode === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 space-y-6 text-center"
          >
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-muted-foreground/30">EXTERNAL_ACCESS</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                Ainda não possui credenciais de treinador?
              </p>

              <button
                onClick={() => navigate("/registro-treinador")}
                className="group flex items-center justify-center gap-3 w-full font-mono text-[10px] uppercase tracking-[0.3em] text-white hover:text-primary transition-all font-bold"
              >
                <Trophy className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                CADASTRAR_TREINADOR_OFICIAL
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Decorative Telemetry Overlay */}
      <div className="fixed bottom-10 left-10 hidden lg:block">
        <div className="font-mono text-[7px] uppercase tracking-[0.5em] text-white/10 space-y-2">
          <div>CORE_OS // V.04.5B</div>
          <div>STATION_ID: L-LOGIN_NODE_01</div>
          <div className="flex gap-2">
            <div className="w-1 h-1 bg-primary/20 rounded-full" />
            <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-primary/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
