import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo_fit.png";

const AguardandoAprovacao = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-safe pt-safe pb-safe">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md text-center space-y-8"
      >
        <div className="flex justify-center mb-6">
          <img src={logo} alt="FitBlock" className="h-24 w-auto object-contain" />
        </div>

        <div className="card-premium rounded-[32px] p-8 space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Clock className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black">Acesso em análise</h1>
            <p className="text-muted-foreground">
              Seu perfil de treinador está sendo revisado pela nossa equipe. 
              Você receberá um email assim que seu acesso for liberado.
            </p>
          </div>

          <div className="app-surface-soft rounded-[24px] p-4 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Conta criada com sucesso</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center text-[10px]">2</div>
              <span>Validação de credenciais</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center text-[10px]">3</div>
              <span>Liberação do painel</span>
            </div>
          </div>

          <Button variant="secondary-pill" className="w-full" onClick={handleLogout}>
            Sair da conta
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Dúvidas? Entre em contato com o suporte da sua unidade.</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AguardandoAprovacao;
