import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Trophy, Key } from "lucide-react";
import logo from "@/assets/logo_fit.png";

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
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/redirect", { replace: true });
      setPageLoading(false);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword || !accessCode.trim() || !franchiseUnit.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
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

      if (signUpError) throw signUpError;
      await new Promise((r) => setTimeout(r, 1500));

      const { data: result, error: fnError } = await supabase.functions.invoke("validate-trainer-code", {
        body: {
          access_code: accessCode.trim().toUpperCase(),
          franchise_unit: franchiseUnit.trim(),
        },
      });

      if (fnError) {
        setCodeError("Código não reconhecido. Verifique com a franquia FitBlock.");
        toast.error("Erro ao validar código de acesso");
        setLoading(false);
        return;
      }

      if (!result?.success) {
        setCodeError(result?.message || "Código não reconhecido. Verifique com a franquia FitBlock.");
        toast.error("Código de acesso inválido");
        setLoading(false);
        return;
      }

      toast.success("Bem-vindo, Treinador Oficial FitBlock! 🏆");
      await new Promise((r) => setTimeout(r, 800));
      navigate("/redirect");
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.message?.includes("already registered")) {
        toast.error("Este email já está registrado");
      } else {
        toast.error(err.message || "Erro ao criar conta");
      }
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
      </div>

      {/* ── Register Interface ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-20"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent clip-cut-corner-lg opacity-50" />
          <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl p-10 relative clip-cut-corner-lg border border-white/5">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(51,33,74,0.45)]" />
                   <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-primary font-bold">OFFICIAL_TRAINER_ENROLLMENT</span>
                </div>
                <h1 className="font-display text-4xl uppercase tracking-tighter text-white leading-none">
                  Cadastro <span className="text-primary italic">Oficial</span>
                </h1>
              </div>
              <div className="flex justify-center md:justify-end">
                <img src={logo} alt="FitBlock" className="h-20 w-auto object-contain brightness-110 drop-shadow-[0_0_30px_rgba(51,33,74,0.18)]" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Seção 1: Credenciais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Full_Name</Label>
                  <Input
                    placeholder="NOME_COMPLETO"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Network_Identity</Label>
                  <Input
                    type="email"
                    placeholder="EMAIL_DE_ACESSO"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Master_Key</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Key_Verification</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase outline-none transition-all"
                  />
                </div>
              </div>

              {/* Seção 2: Validação Industrial */}
              <div className="bg-white/[0.02] border border-white/5 p-6 space-y-6 clip-cut-corner-sm">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/60 font-bold">SECURITY_VERIFICATION</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Access_Auth_Code</Label>
                    <Input
                      placeholder="FBK-XXXX-XX"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      disabled={loading}
                      className={cn(
                        "h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase outline-none transition-all",
                        codeError && "border-destructive text-destructive"
                      )}
                    />
                    {codeError && <p className="font-mono text-[7px] text-destructive uppercase tracking-widest ml-1">{codeError}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Franchise_Unit</Label>
                    <Input
                      placeholder="UNIDADE_EX_MOEMA"
                      value={franchiseUnit}
                      onChange={(e) => setFranchiseUnit(e.target.value)}
                      disabled={loading}
                      className="h-14 border-white/10 bg-white/5 focus:border-primary font-mono text-xs tracking-widest uppercase outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-white text-black font-display-wide font-extrabold uppercase text-xs hover:bg-white/90 transition-all flex items-center justify-between px-10 group disabled:opacity-50 shadow-2xl rounded-2xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      INITIALIZING_REGISTRY
                    </>
                  ) : (
                    <>
                      <span>EFETIVAR_CADASTRO_MESTRE</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                    </>
                  )}
                </button>

                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Já possui credenciais?{" "}
                  <Link to="/login" className="text-primary hover:text-white transition-colors font-bold">
                    VOLTAR_AO_LOGIN
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrainerRegister;
