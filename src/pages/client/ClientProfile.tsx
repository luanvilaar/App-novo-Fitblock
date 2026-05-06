import { ChangeEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Shield,
  Target,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  StudentPageSection,
  StudentPill,
  StudentSectionHeading,
  StudentStatCard,
  StudentSurfaceCard,
} from "@/components/client/StudentPagePrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [groupCount, setGroupCount] = useState(0);

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

      const { data: student } = await supabase
        .from("students")
        .select("id, trainer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (student?.id) {
        const { count } = await supabase
          .from("group_members")
          .select("group_id", { count: "exact", head: true })
          .eq("student_id", student.id);
        setGroupCount(count ?? 0);

        if (student.trainer_id) {
          const { data: trainer } = await supabase
            .from("trainers")
            .select("user_id")
            .eq("id", student.trainer_id)
            .maybeSingle();
          if (trainer?.user_id) {
            const { data: trainerProfile } = await supabase
              .from("profiles")
              .select("name, email")
              .eq("user_id", trainer.user_id)
              .maybeSingle();
            setTrainerName(trainerProfile?.name ?? trainerProfile?.email ?? null);
          }
        }
      }
    };
    void fetchProfile();
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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    } catch {
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
    <StudentPageSection>
      <StudentSurfaceCard className="p-6 sm:p-8" tone="strong">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <StudentPill>Athlete identity</StudentPill>
            <div className="space-y-2">
              <h1 className="font-display text-4xl text-black sm:text-5xl">Perfil do atleta</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-black/58 sm:text-base">
                O perfil agora funciona como central de identidade esportiva e conta. Dados da conta continuam aqui, mas o contexto atlético ganhou prioridade visual.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StudentStatCard eyebrow="Coach" value={trainerName ?? "Sem vínculo"} label="treinador atual" icon={Target} />
            <StudentStatCard eyebrow="Grupos" value={groupCount} label="comunidades ativas" icon={Shield} accent />
            <StudentStatCard eyebrow="Acesso" value={roles.join(", ")} label="permissões desta conta" icon={User} />
          </div>
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard className="p-8 text-center">
        <div className="relative mx-auto mb-6 h-28 w-28">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-28 w-28 rounded-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-black/8 bg-[#efefef] text-black">
              <User className="h-10 w-10" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-transform hover:scale-105">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-black">{profileName || user?.email}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/35">{user?.email}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/8 bg-[#efefef] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">
            <Shield className="h-3.5 w-3.5" />
            Athlete workspace
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary-pill" className="h-12 px-6">
            <Link to="/dashboard/treinadores">Gerir vínculo com coach</Link>
          </Button>
          <Button asChild variant="secondary-pill" className="h-12 px-6">
            <Link to="/dashboard/evolucao">Abrir evolução</Link>
          </Button>
        </div>
      </StudentSurfaceCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <StudentSurfaceCard className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <Target className="h-5 w-5 text-black" />
            <h2 className="font-display text-2xl text-black">Informações atléticas</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">Gênero</Label>
              <Select value={gender} onValueChange={(value) => setGender(value as "" | "male" | "female")}>
                <SelectTrigger className="h-12 rounded-full border-black/8 bg-[#f3f3f3] text-black focus:ring-0">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-black/8 bg-white text-black">
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">Nascimento</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="h-12 border-black/8 bg-[#f3f3f3] text-black"
              />
            </div>
          </div>

          <button
            onClick={handleSaveDemographics}
            disabled={savingDemo}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            {savingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar informações"}
          </button>
        </StudentSurfaceCard>

        <StudentSurfaceCard className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-black" />
            <h2 className="font-display text-2xl text-black">Segurança da conta</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-12 border-black/8 bg-[#f3f3f3] pr-12 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/36 hover:text-black"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">Confirmar senha</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 border-black/8 bg-[#f3f3f3] text-black"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full border border-black/8 bg-[#efefef] text-sm font-semibold text-black transition-all hover:bg-[#e2e2e2] active:scale-[0.98] disabled:opacity-20"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar senha"}
          </button>
        </StudentSurfaceCard>
      </div>

      <StudentSurfaceCard className="p-6 sm:p-8">
        <StudentSectionHeading
          eyebrow="Conta"
          title="Ações rápidas"
          description="Gerencie sua conta sem sair do contexto de atleta."
          action={
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/historico">Rever treinos</Link>
              </Button>
              <button
                onClick={signOut}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-black/8 bg-[#efefef] px-6 text-sm font-semibold text-black transition-all hover:bg-[#e2e2e2]"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          }
        />
      </StudentSurfaceCard>
    </StudentPageSection>
  );
};

export default ClientProfile;
