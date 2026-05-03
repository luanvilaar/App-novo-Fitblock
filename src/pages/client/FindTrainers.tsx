import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, UserRound, MapPin, Loader2, Send, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
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
    const { data, error } = await supabase
      .from("athlete_link_requests")
      .select("id, trainer_id, status, requested_at, responded_at")
      .eq("student_id", sid)
      .order("requested_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error(error);
      return;
    }
    setMyRequests((data as MyRequest[]) || []);
  }, []);

  const loadTrainers = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("trainers")
      .select("id, user_id, trainer_code, franchise_unit, coach_status")
      .or("coach_status.eq.approved,coach_status.is.null");
    if (error) {
      toast.error("Não foi possível carregar treinadores.");
      console.error(error);
      setTrainers([]);
      return;
    }
    const list = (rows || []) as TrainerRow[];
    const visible = list.filter(
      (t) =>
        t.coach_status !== "pending" &&
        t.coach_status !== "rejected" &&
        t.coach_status !== "suspended"
    );
    setTrainers(visible);

    const uids = [...new Set(visible.map((t) => t.user_id))];
    if (uids.length === 0) {
      setProfilesByUserId(new Map());
      return;
    }
    const { data: profs } = await supabase.from("profiles").select("user_id, name, email").in("user_id", uids);
    const m = new Map<string, ProfileMini>();
    (profs as ProfileMini[] | null)?.forEach((p) => m.set(p.user_id, p));
    setProfilesByUserId(m);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: st } = await supabase
        .from("students")
        .select("id, trainer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!st?.id) {
        toast.error("Perfil de atleta não encontrado.");
        setLoading(false);
        return;
      }
      setStudentId(st.id);
      setCurrentTrainerId(st.trainer_id ?? null);
      await Promise.all([loadTrainers(), loadMyRequests(st.id)]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loadTrainers, loadMyRequests]);

  const pendingByTrainerId = useMemo(() => {
    const s = new Set<string>();
    myRequests.filter((r) => r.status === "pending").forEach((r) => s.add(r.trainer_id));
    return s;
  }, [myRequests]);

  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => {
      const p = profilesByUserId.get(t.user_id);
      const name = (p?.name || "").toLowerCase();
      const email = (p?.email || "").toLowerCase();
      const unit = (t.franchise_unit || "").toLowerCase();
      const code = (t.trainer_code || "").toLowerCase();
      return name.includes(q) || email.includes(q) || unit.includes(q) || code.includes(q);
    });
  }, [trainers, profilesByUserId, search]);

  const handleRequest = async (trainer: TrainerRow) => {
    if (!studentId) return;
    if (currentTrainerId === trainer.id) {
      toast.info("Este já é o seu treinador atual.");
      return;
    }
    if (pendingByTrainerId.has(trainer.id)) {
      toast.info("Já existe um pedido pendente para este treinador.");
      return;
    }
    setRequestingId(trainer.id);
    const { error } = await supabase.from("athlete_link_requests").insert({
      student_id: studentId,
      trainer_id: trainer.id,
      status: "pending",
    });
    setRequestingId(null);
    if (error) {
      if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique")) {
        toast.error("Já existe um pedido pendente para este treinador.");
      } else {
        toast.error(error.message || "Erro ao enviar pedido.");
      }
      return;
    }
    toast.success("Pedido enviado. Aguarde a aprovação do treinador.");
    loadMyRequests(studentId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">Não foi possível carregar o seu perfil de atleta.</p>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
          <UserRound className="w-3 h-3" /> Treinadores FitBlock
        </div>
        <h1 className="font-display text-3xl font-normal tracking-[-0.05em] text-foreground">Encontrar treinador</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pesquise treinadores disponíveis na plataforma e solicite vínculo. O treinador precisa aprovar o pedido.
        </p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, e-mail, unidade ou código..."
          className="h-11 rounded-lg border-border bg-card pl-10"
        />
      </div>

      {myRequests.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            <ClipboardList className="w-3 h-3" /> Meus pedidos
          </div>
          <ul className="space-y-2">
            {myRequests.map((r) => {
              const tr = trainers.find((t) => t.id === r.trainer_id);
              const pr = tr ? profilesByUserId.get(tr.user_id) : undefined;
              const label = pr?.name || pr?.email || "Treinador";
              const reqAt = r.requested_at ? new Date(r.requested_at) : null;
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-3 text-xs"
                >
                  <span className="truncate font-body text-sm text-foreground">{label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                      r.status === "pending" && "bg-amber-500/15 text-amber-600",
                      r.status === "approved" && "bg-primary/15 text-primary",
                      r.status === "rejected" && "bg-destructive/10 text-destructive"
                    )}
                  >
                    {statusLabel[r.status] || r.status}
                  </span>
                  {reqAt && (
                    <span className="w-full text-[10px] text-muted-foreground">
                      {format(reqAt, "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {filteredTrainers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum treinador encontrado.</p>
          </div>
        ) : (
          filteredTrainers.map((t, i) => {
            const p = profilesByUserId.get(t.user_id);
            const name = p?.name || p?.email || "Treinador";
            const isCurrent = currentTrainerId === t.id;
            const isPending = pendingByTrainerId.has(t.id);
            const busy = requestingId === t.id;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="font-display text-[1.35rem] font-normal leading-none tracking-[-0.04em] text-foreground">{name}</div>
                    {p?.email && <div className="truncate text-sm text-muted-foreground">{p.email}</div>}
                    {t.franchise_unit && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {t.franchise_unit}
                      </div>
                    )}
                    {t.trainer_code && (
                      <div className="mt-2 inline-flex rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                        {t.trainer_code}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant={isCurrent ? "secondary" : isPending ? "secondary" : "default"}
                  className="h-11 w-full rounded-lg"
                  disabled={isCurrent || isPending || busy}
                  onClick={() => handleRequest(t)}
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Seu treinador atual"
                  ) : isPending ? (
                    "Pedido pendente"
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-2" /> Solicitar vínculo
                    </>
                  )}
                </Button>
                {isCurrent && (
                  <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    Não é necessário solicitar de novo: seu cadastro já aponta para este treinador. Para treinar com outro,
                    o treinador atual precisa desvincular ou você pode usar outra conta de atleta.
                  </p>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindTrainers;
