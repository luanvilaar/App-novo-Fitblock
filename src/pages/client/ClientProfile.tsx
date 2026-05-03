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
      toast.error("Erro ao salvar dados.");
    } else {
      toast.success("Perfil atualizado!");
    }
    setSavingDemo(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error("Erro no upload.");
    }
    setUploading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  return (
    <div className="min-h-screen bg-white text-black space-y-8 pb-32">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
          Conta
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-black">
          Perfil
        </h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-[#f3f3f3] p-8 text-center"
      >
        <div className="relative w-28 h-28 mx-auto mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-black text-white">
              <User className="w-10 h-10" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-110">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div className="space-y-1">
          <h2 className="font-sans text-xl font-bold">{profileName || user?.email}</h2>
          <p className="font-mono text-[10px] uppercase font-bold opacity-30">{user?.email}</p>
          <div className="inline-flex mt-4 items-center gap-2 rounded-full bg-black/5 px-4 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black/60">
            <Shield className="w-3 h-3" />
            {roles.join(", ")}
          </div>
        </div>
      </motion.div>

      {/* Ranking Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6 rounded-3xl bg-white p-8 ring-1 ring-black/5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 opacity-40" />
          <h2 className="font-sans text-lg font-bold">Informações</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-[9px] font-bold uppercase tracking-wider opacity-40">Gênero</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as "" | "male" | "female")}>
              <SelectTrigger className="h-12 rounded-full border-black/5 bg-[#f3f3f3] font-sans text-sm font-bold focus:ring-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="border-black/5 bg-white font-sans">
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[9px] font-bold uppercase tracking-wider opacity-40">Nascimento</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-12 rounded-full border-black/5 bg-[#f3f3f3] font-sans text-sm font-bold"
            />
          </div>
        </div>

        <button
          onClick={handleSaveDemographics}
          disabled={savingDemo}
          className="h-14 w-full rounded-full bg-black font-sans text-sm font-bold text-white transition-all active:scale-[0.98]"
        >
          {savingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar alterações"}
        </button>
      </motion.div>

      {/* Security Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6 rounded-3xl bg-white p-8 ring-1 ring-black/5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 opacity-40" />
          <h2 className="font-sans text-lg font-bold">Segurança</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-[9px] font-bold uppercase tracking-wider opacity-40">Nova Senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 rounded-full border-black/5 bg-[#f3f3f3] pr-12 font-sans text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[9px] font-bold uppercase tracking-wider opacity-40">Confirmar Senha</Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-full border-black/5 bg-[#f3f3f3] font-sans text-sm font-bold"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changingPassword || !newPassword || !confirmPassword}
          className="h-14 w-full rounded-full bg-black font-sans text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-20"
        >
          {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar senha"}
        </button>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button onClick={signOut} className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-[#f3f3f3] font-sans text-sm font-bold text-red-500 transition-all active:scale-[0.98]">
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </motion.div>
    </div>
  );
};

export default ClientProfile;
