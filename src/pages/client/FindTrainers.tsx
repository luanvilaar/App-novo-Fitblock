import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MapPin, Search, Send, UserRound, XCircle } from "lucide-react";

import {
  StudentEmptyState,
  StudentPageSection,
  StudentPill,
  StudentSectionHeading,
  StudentStatCard,
  StudentSurfaceCard,
} from "@/components/client/StudentPagePrimitives";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TrainerRow = {
  id: string;
  user_id: string;
  trainer_code: string | null;
  franchise_unit: string | null;
  coach_status: string | null;
};

type ProfileMini = { user_id: string; name: string | null; email: string | null };

type MyRequest = {
  id: string;
  trainer_id: string;
  status: string;
  requested_at: string | null;
  responded_at: string | null;
};

const statusMeta: Record<string, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pendente", tone: "text-black/45", icon: Loader2 },
  approved: { label: "Aprovado", tone: "text-black", icon: CheckCircle2 },
  rejected: { label: "Recusado", tone: "text-black/45", icon: XCircle },
};

const FindTrainers = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [currentTrainerId, setCurrentTrainerId] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [profilesByUserId, setProfilesByUserId] = useState<Map<string, ProfileMini>>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const loadMyRequests = useCallback(async (sid: string) => {
    const { data } = await supabase
      .from("athlete_link_requests")
      .select("id, trainer_id, status, requested_at, responded_at")
      .eq("student_id", sid)
      .order("requested_at", { ascending: false })
      .limit(30);
    setMyRequests((data as MyRequest[]) ?? []);
  }, []);

  const loadTrainers = useCallback(async () => {
    const { data: rows } = await supabase
      .from("trainers")
      .select("id, user_id, trainer_code, franchise_unit, coach_status")
      .or("coach_status.eq.approved,coach_status.is.null");

    const list = (rows ?? []) as TrainerRow[];
    const visible = list.filter(
      (trainer) =>
        trainer.coach_status !== "pending" &&
        trainer.coach_status !== "rejected" &&
        trainer.coach_status !== "suspended",
    );
    setTrainers(visible);

    const userIds = [...new Set(visible.map((trainer) => trainer.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", userIds);
      const map = new Map<string, ProfileMini>();
      (profiles as ProfileMini[] | null)?.forEach((profile) => map.set(profile.user_id, profile));
      setProfilesByUserId(map);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: student } = await supabase
        .from("students")
        .select("id, trainer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (student?.id) {
        setStudentId(student.id);
        setCurrentTrainerId(student.trainer_id ?? null);
        await Promise.all([loadTrainers(), loadMyRequests(student.id)]);
      }
      setLoading(false);
    };
    void load();
  }, [user, loadMyRequests, loadTrainers]);

  const filteredTrainers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return trainers;

    return trainers.filter((trainer) => {
      const profile = profilesByUserId.get(trainer.user_id);
      return (
        (profile?.name || "").toLowerCase().includes(query) ||
        (profile?.email || "").toLowerCase().includes(query) ||
        (trainer.franchise_unit || "").toLowerCase().includes(query)
      );
    });
  }, [profilesByUserId, search, trainers]);

  const currentTrainer = trainers.find((trainer) => trainer.id === currentTrainerId) ?? null;
  const currentTrainerProfile = currentTrainer ? profilesByUserId.get(currentTrainer.user_id) : null;

  const handleRequest = async (trainer: TrainerRow) => {
    if (!studentId) return;
    setRequestingId(trainer.id);
    const { error } = await supabase
      .from("athlete_link_requests")
      .insert({ student_id: studentId, trainer_id: trainer.id, status: "pending" });
    setRequestingId(null);

    if (!error) {
      toast.success("Pedido enviado!");
      void loadMyRequests(studentId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-black">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <StudentPageSection>
      <StudentSurfaceCard className="p-6 sm:p-8" tone="strong">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <StudentPill>Coach relation</StudentPill>
            <div className="space-y-2">
              <h1 className="font-display text-4xl text-black sm:text-5xl">Treinadores e vínculo</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-black/58 sm:text-base">
                Esta rota deixou de ser só busca. Agora ela mostra seu coach atual, o status das solicitações e a descoberta de novos treinadores.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StudentStatCard
              eyebrow="Coach atual"
              value={currentTrainerProfile?.name ?? "Sem vínculo"}
              label={currentTrainer?.franchise_unit ?? "Nenhuma unidade conectada"}
              icon={UserRound}
            />
            <StudentStatCard eyebrow="Solicitações" value={myRequests.length} label="histórico recente de vínculo" icon={Send} accent />
          </div>
        </div>
      </StudentSurfaceCard>

      {currentTrainer ? (
        <StudentSurfaceCard className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Seu treinador</p>
              <h2 className="mt-2 font-display text-3xl text-black">{currentTrainerProfile?.name ?? "Treinador conectado"}</h2>
              <p className="mt-3 text-sm text-black/54">
                {currentTrainer.franchise_unit ?? "Sem unidade informada"}
                {currentTrainer.trainer_code ? ` • código ${currentTrainer.trainer_code}` : ""}
              </p>
            </div>
            <div className="rounded-full border border-black bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white">
              vínculo ativo
            </div>
          </div>
        </StudentSurfaceCard>
      ) : null}

      {myRequests.length > 0 ? (
        <StudentSurfaceCard className="p-6 sm:p-8">
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Status das solicitações</p>
            <h2 className="mt-2 font-display text-3xl text-black">Acompanhamento</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {myRequests.slice(0, 3).map((request) => {
              const trainer = trainers.find((entry) => entry.id === request.trainer_id);
              const profile = trainer ? profilesByUserId.get(trainer.user_id) : null;
              const meta = statusMeta[request.status] ?? statusMeta.pending;
              const Icon = meta.icon;

              return (
                <div key={request.id} className="rounded-[1.35rem] border border-black/8 bg-[#f8f8f8] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-black">{profile?.name ?? "Treinador"}</p>
                    <Icon className={cn("h-4 w-4", request.status === "pending" ? "animate-spin text-black/45" : meta.tone)} />
                  </div>
                  <p className={cn("mt-2 font-mono text-[10px] uppercase tracking-[0.22em]", request.status === "approved" ? "text-black" : "text-black/45")}>{meta.label}</p>
                </div>
              );
            })}
          </div>
        </StudentSurfaceCard>
      ) : null}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/28" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar treinador ou unidade..."
          className="h-14 border-black/8 bg-white pl-12 text-sm font-semibold text-black placeholder:text-black/28"
        />
      </div>

      {filteredTrainers.length === 0 ? (
        <StudentEmptyState
          icon={Search}
          title="Nenhum treinador encontrado"
          description="Refine a busca por nome, e-mail ou unidade."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTrainers.map((trainer, index) => {
            const profile = profilesByUserId.get(trainer.user_id);
            const name = profile?.name || profile?.email || "Treinador";
            const isCurrent = currentTrainerId === trainer.id;
            const isPending = myRequests.some((request) => request.trainer_id === trainer.id && request.status === "pending");

            return (
              <motion.div
                key={trainer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <StudentSurfaceCard className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-black/6 bg-[#efefef] text-black/64">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-black">{name}</h3>
                        {trainer.franchise_unit ? (
                          <div className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">
                            <MapPin className="h-3.5 w-3.5" />
                            {trainer.franchise_unit}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {trainer.trainer_code ? (
                      <div className="rounded-full border border-black/8 bg-[#efefef] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
                        {trainer.trainer_code}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      disabled={isCurrent || isPending || requestingId === trainer.id}
                      onClick={() => void handleRequest(trainer)}
                      className={cn(
                        "flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.18em] transition-all",
                        isCurrent || isPending
                          ? "border border-black/8 bg-[#efefef] text-black/45"
                          : "bg-black text-white hover:bg-black/90 active:scale-[0.98]",
                      )}
                    >
                      {requestingId === trainer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isCurrent ? "Vínculo ativo" : isPending ? "Solicitação enviada" : "Solicitar vínculo"}
                    </button>
                  </div>
                </StudentSurfaceCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </StudentPageSection>
  );
};

export default FindTrainers;
