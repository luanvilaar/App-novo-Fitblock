import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Shield } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo_fit.png";

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

    void handleRecovery();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      if (error) {
        throw error;
      }
      toast.success("Senha atualizada com sucesso.");
      setTimeout(() => navigate("/redirect"), 1600);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar senha.";
      toast.error(message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            validando acesso
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-safe pt-safe pb-safe">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium w-full max-w-md rounded-[32px] p-6 sm:p-8"
      >
        <div className="mb-8 flex justify-center border-b border-border pb-6">
          <img src={logo} alt="FitBlock Training" className="h-20 w-auto object-contain" />
        </div>

        {!isRecovery ? (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h1 className="font-display text-3xl text-foreground">Link inválido</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O link de recuperação expirou, foi usado anteriormente ou não está completo.
              </p>
            </div>

            <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Solicite um novo email de recuperação a partir da tela principal de acesso.
            </div>

            <Button type="button" variant="secondary-pill" className="w-full" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
              voltar ao acesso
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="font-display text-3xl text-foreground">Defina sua nova senha</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Escolha uma senha segura para concluir a recuperação e voltar ao app.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Nova senha
                </Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-password-confirm" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Confirmar senha
                </Label>
                <Input
                  id="reset-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="primary-pill" size="xl" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    atualizando
                  </>
                ) : (
                  <>
                    atualizar senha
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex w-full items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              voltar ao login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
