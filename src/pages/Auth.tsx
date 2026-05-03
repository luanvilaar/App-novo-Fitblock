import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo_fit.png";
import { formatAuthEmailError } from "@/lib/auth-email-errors";

interface BoxOption {
  id: string;
  slug: string;
  name: string;
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<string>("");
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/redirect", { replace: true });
    });
  }, [navigate]);

  // Load boxes for signup
  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const { data } = await supabase
          .from("boxes" as any)
          .select("id, slug, name")
          .order("name");
        if (data && Array.isArray(data)) {
          setBoxes(data as unknown as BoxOption[]);
          // Default to first box
          if (data.length > 0 && !selectedBoxId) {
            setSelectedBoxId((data[0] as any).id);
          }
        }
      } catch {
        // boxes table may not exist yet
      }
    };
    loadBoxes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setIsForgot(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await new Promise((r) => setTimeout(r, 600));
        navigate("/redirect");
      } else {
        if (!selectedBoxId) {
          toast.error("Selecione sua box");
          setLoading(false);
          return;
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, box_id: selectedBoxId },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // After signup, update the profile and student with box_id
        if (signUpData.user) {
          // Use a slight delay to allow handle_new_user trigger to complete
          setTimeout(async () => {
            try {
              await supabase
                .from("profiles")
                .update({ box_id: selectedBoxId } as any)
                .eq("user_id", signUpData.user!.id);
              await supabase
                .from("students")
                .update({ box_id: selectedBoxId } as any)
                .eq("user_id", signUpData.user!.id);
            } catch {
              // Non-critical — admin can assign later
            }
          }, 2000);
        }

        toast.success("Cadastro realizado! Verifique seu email para confirmar.");
        // Notify admin about new user
        const selectedBox = boxes.find((b) => b.id === selectedBoxId);
        supabase.functions.invoke("notify-admin-new-user", {
          body: {
            record: {
              name,
              email,
              created_at: new Date().toISOString(),
              box_name: selectedBox?.name || "",
            },
          },
        }).catch(() => {});
      }
    } catch (error: any) {
      toast.error(formatAuthEmailError(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-6 justify-center">
          <img src={logo} alt="FitBlock Training" className="h-32 w-auto object-contain" />
        </Link>

        <div className="card-premium p-8">
          <h1 className="text-2xl font-black mb-1 text-center">
            {isForgot ? "Recuperar senha" : isLogin ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {isForgot
              ? "Insira seu email para recuperar"
              : isLogin
              ? "Acesse sua conta FitBlock"
              : "Comece sua jornada agora"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgot && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="h-12 rounded-xl bg-secondary border-border"
                  />
                </div>

                {boxes.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="box">Sua Box</Label>
                    <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                      <SelectTrigger className="h-12 rounded-xl bg-secondary border-border">
                        <SelectValue placeholder="Selecione sua box" />
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-12 rounded-xl bg-secondary border-border"
              />
            </div>

            {!isForgot && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-12 rounded-xl bg-secondary border-border"
                />
              </div>
            )}

            <Button variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isForgot ? "Enviar email" : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {isLogin && !isForgot && (
              <button
                onClick={() => setIsForgot(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu a senha?
              </button>
            )}
            <div>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setIsForgot(false);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
              </button>
            </div>
            {isForgot && (
              <button
                onClick={() => setIsForgot(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
