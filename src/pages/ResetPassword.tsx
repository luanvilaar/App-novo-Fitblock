import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, AlertCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import logoLight from "@/assets/fitblock-logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleRecovery = async () => {
      const hash = window.location.hash;

      if (hash && (hash.includes("type=recovery") || hash.includes("access_token="))) {
        setIsRecovery(true);
        setChecking(false);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
          setChecking(false);
        }
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsRecovery(true);
      }

      const timeout = setTimeout(() => {
        setChecking(false);
      }, 2000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    };

    handleRecovery();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      setTimeout(() => navigate("/redirect"), 2000);
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Validando acesso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <motion.div
          key={isRecovery ? "recovery" : "invalid"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="card-premium rounded-2xl border border-border/60 bg-card p-8 sm:p-10 shadow-sm space-y-8"
        >
          <div className="flex justify-center pb-4 border-b border-border/40">
            <img
              src={logoLight}
              alt="FitBlock Training"
              className="h-28 w-auto sm:h-32 max-w-[min(100%,420px)] object-contain object-center"
            />
          </div>

          {!isRecovery ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Link inválido</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Recuperação de senha
                </p>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium leading-relaxed">
                  O link parece estar corrompido, expirado ou já foi utilizado. Solicite um novo e-mail de
                  recuperação na tela de login.
                </p>
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Shield className="h-6 w-6" aria-hidden />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Nova senha</h1>
                <p className="text-sm text-muted-foreground leading-relaxed px-1">
                  Defina uma senha segura para sua conta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">Nova senha</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password-confirm">Confirmar senha</Label>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl bg-secondary border-border"
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      Atualizar senha
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/")}
              >
                Voltar ao login
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
