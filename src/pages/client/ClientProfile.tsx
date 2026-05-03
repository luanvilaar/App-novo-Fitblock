import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, User, Camera, Loader2, Lock, Eye, EyeOff, Shield, Trophy, Activity } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ClientProfile = () => {
  const { user, signOut, roles } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [birthDate, setBirthDate] = useState("");
  const [savingDemo, setSavingDemo] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url, gender, birth_date")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfileName(data.name);
        setAvatarUrl(data.avatar_url);
        if (data.gender === "male" || data.gender === "female") setGender(data.gender);
        if (data.birth_date) setBirthDate(data.birth_date);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveDemographics = async () => {
    if (!user) return;
    setSavingDemo(true);
    const { error } = await supabase
      .from("profiles")
      .update({ gender: gender || null, birth_date: birthDate || null })
      .eq("user_id", user.id);
    if (error) {
      const msg = error.message || "";
      if (msg.includes("column") || msg.includes("does not exist")) {
        toast.error("A migração de ranking ainda não foi aplicada no banco de dados.");
      } else {
        toast.error("Erro ao salvar dados de ranking");
      }
    } else {
      toast.success("Dados de ranking atualizados!");
    }
    setSavingDemo(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExts.includes(ext)) {
      toast.error("Apenas JPG, PNG, WebP e GIF são permitidos");
      return;
    }
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      toast.error("Selecione uma imagem válida (SVG não permitido)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    }
    setUploading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message || "Erro ao atualizar senha");
    } else {
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  return (
    <div className="space-y-10 pb-24">
      
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
          <Activity className="w-3 h-3" /> USER_PROFILE
        </div>
        <h1 className="font-display text-3xl font-normal tracking-[-0.05em] text-foreground">
          Configurações de perfil
        </h1>
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
          Gerenciamento de perfil e credenciais
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-8"
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-24 w-24 rounded-xl border border-primary/20 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-border bg-background">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-primary transition-colors hover:opacity-90">
            {uploading ? (
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-primary-foreground" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="text-center space-y-2">
          <p className="font-display text-xl font-normal tracking-[-0.04em] text-foreground">{profileName || user?.email}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{user?.email}</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground">
            <Shield className="w-3 h-3 text-primary" />
            {roles.join(", ")}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-5 rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-display text-lg font-normal tracking-[-0.03em] text-foreground">Dados de ranking</h2>
            <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground">COMPETITIVE_DATA</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Gênero</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as "" | "male" | "female")}>
            <SelectTrigger className="h-12 rounded-lg border-border bg-background font-mono text-xs uppercase tracking-[0.16em] focus:ring-0">
              <SelectValue placeholder="SELECIONE SEU GÊNERO" />
            </SelectTrigger>
            <SelectContent className="border-border bg-background font-mono text-xs">
              <SelectItem value="male">MASCULINO</SelectItem>
              <SelectItem value="female">FEMININO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Data de Nascimento</Label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="h-12 rounded-lg border-border bg-background font-mono text-xs focus:border-primary"
          />
        </div>

        <button
          onClick={handleSaveDemographics}
          disabled={savingDemo}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground font-mono text-[10px] uppercase tracking-[0.16em] text-background transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          {savingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
          Salvar dados de ranking
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-5 rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-display text-lg font-normal tracking-[-0.03em] text-foreground">Segurança</h2>
            <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground">CREDENTIALS_MANAGEMENT</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Nova Senha</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="MÍNIMO 6 CARACTERES"
              className="h-12 rounded-lg border-border bg-background pr-10 font-mono text-xs uppercase tracking-[0.16em] focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Confirmar Senha</Label>
          <Input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="REPITA A SENHA"
            className="h-12 rounded-lg border-border bg-background font-mono text-xs uppercase tracking-[0.16em] focus:border-primary"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changingPassword || !newPassword || !confirmPassword}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground font-mono text-[10px] uppercase tracking-[0.16em] text-background transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Salvar nova senha
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button onClick={signOut} className="flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-border font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-300 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="w-4 h-4" />
          Encerrar Sessão
        </button>
      </motion.div>
    </div>
  );
};

export default ClientProfile;
