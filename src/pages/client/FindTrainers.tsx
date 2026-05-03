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
    const { data } = await supabase
      .from("athlete_link_requests")
      .select("id, trainer_id, status, requested_at, responded_at")
      .eq("student_id", sid)
      .order("requested_at", { ascending: false })
      .limit(30);
    setMyRequests((data as MyRequest[]) || []);
  }, []);

  const loadTrainers = useCallback(async () => {
    const { data: rows } = await supabase
      .from("trainers")
      .select("id, user_id, trainer_code, franchise_unit, coach_status")
      .or("coach_status.eq.approved,coach_status.is.null");
    const list = (rows || []) as TrainerRow[];
    const visible = list.filter((t) => t.coach_status !== "pending" && t.coach_status !== "rejected" && t.coach_status !== "suspended");
    setTrainers(visible);

    const uids = [...new Set(visible.map((t) => t.user_id))];
    if (uids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, name, email").in("user_id", uids);
      const m = new Map<string, ProfileMini>();
      (profs as ProfileMini[] | null)?.forEach((p) => m.set(p.user_id, p));
      setProfilesByUserId(m);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: st } = await supabase.from("students").select("id, trainer_id").eq("user_id", user.id).maybeSingle();
      if (st?.id) {
        setStudentId(st.id);
        setCurrentTrainerId(st.trainer_id ?? null);
        await Promise.all([loadTrainers(), loadMyRequests(st.id)]);
      }
      setLoading(false);
    })();
  }, [user, loadTrainers, loadMyRequests]);

  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => {
      const p = profilesByUserId.get(t.user_id);
      return (p?.name || "").toLowerCase().includes(q) || (p?.email || "").toLowerCase().includes(q) || (t.franchise_unit || "").toLowerCase().includes(q);
    });
  }, [trainers, profilesByUserId, search]);

  const handleRequest = async (trainer: TrainerRow) => {
    if (!studentId) return;
    setRequestingId(trainer.id);
    const { error } = await supabase.from("athlete_link_requests").insert({ student_id: studentId, trainer_id: trainer.id, status: "pending" });
    setRequestingId(null);
    if (!error) {
      toast.success("Pedido enviado!");
      loadMyRequests(studentId);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-black" /></div>;

  return (
    <div className="min-h-screen bg-white text-black space-y-8 pb-32">
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="space-y-1"
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
          Comunidade
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-black">
          Treinadores
        </h1>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar treinador ou unidade..."
          className="h-14 rounded-full border-black/5 bg-[#f3f3f3] pl-12 font-sans text-sm font-bold text-black focus:border-black/10"
        />
      </div>

      <div className="space-y-4">
        {filteredTrainers.map((t, i) => {
          const p = profilesByUserId.get(t.user_id);
          const name = p?.name || p?.email || "Treinador";
          const isCurrent = currentTrainerId === t.id;
          const isPending = myRequests.some(r => r.trainer_id === t.id && r.status === "pending");
          
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl bg-[#f3f3f3] p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-sans text-lg font-bold">{name}</h3>
                  {t.franchise_unit && (
                    <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black/40">
                      <MapPin className="h-3 w-3" /> {t.franchise_unit}
                    </div>
                  )}
                </div>
                {t.trainer_code && (
                  <div className="rounded-full bg-black/5 px-3 py-1 font-mono text-[9px] font-bold uppercase text-black/60">
                    {t.trainer_code}
                  </div>
                )}
              </div>

              <button
                disabled={isCurrent || isPending || requestingId === t.id}
                onClick={() => handleRequest(t)}
                className={cn(
                  "h-12 w-full rounded-full font-sans text-xs font-bold uppercase tracking-wider transition-all",
                  isCurrent || isPending ? "bg-black/5 text-black/40" : "bg-black text-white active:scale-[0.98]"
                )}
              >
                {requestingId === t.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : isCurrent ? (
                  "Seu treinador"
                ) : isPending ? (
                  "Pendente"
                ) : (
                  "Solicitar vínculo"
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FindTrainers;
