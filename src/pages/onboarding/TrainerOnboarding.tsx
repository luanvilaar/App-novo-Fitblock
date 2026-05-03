import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Step = "code" | "unit";

const TrainerOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("code");
  const [accessCode, setAccessCode] = useState("");
  const [franchiseUnit, setFranchiseUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [trainerCode, setTrainerCode] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  const handleValidateCode = async () => {
    if (!accessCode.trim()) {
      toast.error("Digite o código de acesso");
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Sessão expirada");
      }

      const { data, error } = await supabase.functions.invoke(
        "validate-trainer-code",
        {
          body: {
            access_code: accessCode.trim(),
            franchise_unit: franchiseUnit.trim() || "Não definida",
          },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao validar código");

      setTrainerCode(data.trainer_code);
      toast.success("Código validado!");
      setStep("unit");
    } catch (err: any) {
      toast.error(err.message || "Erro ao validar código de acesso");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!franchiseUnit.trim()) {
      toast.error("Digite o nome da sua unidade");
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error("Usuário não encontrado");

      // Get trainer ID
      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!trainer) throw new Error("Registro de treinador não encontrado");

      // Update franchise unit
      await (supabase as any)
        .from("trainers")
        .update({ franchise_unit: franchiseUnit.trim() })
        .eq("id", trainer.id);

      toast.success("Parabéns! Você é agora um Treinador Oficial FitBlock 🎉");
      await new Promise((r) => setTimeout(r, 1000));
      navigate("/trainer", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar unidade");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-light tracking-tight mb-2">FitBlock Training</h1>
          <p className="text-muted-foreground">
            {step === "code"
              ? "Ative sua conta como Treinador Oficial"
              : "Complete seu perfil de Treinador"}
          </p>
        </div>

        {/* Card */}
        <div className="card-premium p-6 mb-6">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === "code" ? (
              // Step 1: Access Code
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Acesso FitBlock</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Ex: FBK-2025-MOEMA"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                    disabled={loading}
                    className="h-12 rounded-lg bg-secondary border-border text-lg font-mono tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Você recebeu este código da FitBlock Training. Se não tem um código,
                    entre em contato com a franquia.
                  </p>
                </div>

                {/* Optional: Franchise Unit here if user wants to set it in step 1 */}
                <div className="space-y-2">
                  <Label htmlFor="unit">Nome da Sua Unidade (Opcional)</Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="Ex: FitBlock Moema"
                    value={franchiseUnit}
                    onChange={(e) => setFranchiseUnit(e.target.value)}
                    disabled={loading}
                    className="h-12 rounded-lg bg-secondary border-border"
                  />
                </div>

                <Button
                  onClick={handleValidateCode}
                  disabled={loading || !accessCode.trim()}
                  size="lg"
                  className="w-full"
                  variant="hero"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Step 2: Franchise Unit (if not filled in step 1)
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">
                      Código validado!
                    </p>
                    <p className="text-xs text-emerald-200/70">
                      Seu código de treinador é: <span className="font-mono">{trainerCode}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="franchiseUnit">Nome da Sua Unidade</Label>
                  <Input
                    id="franchiseUnit"
                    type="text"
                    placeholder="Ex: FitBlock Moema"
                    value={franchiseUnit}
                    onChange={(e) => setFranchiseUnit(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveUnit()}
                    disabled={loading}
                    className="h-12 rounded-lg bg-secondary border-border"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Seus atletas verão esse nome ao procurar por você.
                  </p>
                </div>

                <Button
                  onClick={handleSaveUnit}
                  disabled={loading || !franchiseUnit.trim()}
                  size="lg"
                  className="w-full"
                  variant="hero"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Confirmar e Acessar Dashboard
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 justify-center">
          <div
            className={`h-1 rounded-full transition-all ${
              step === "code" ? "w-8 bg-primary" : "w-2 bg-primary/30"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-all ${
              step === "unit" ? "w-8 bg-primary" : "w-2 bg-primary/30"
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default TrainerOnboarding;
