import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Dumbbell, Layers, Search, Users } from "lucide-react";
import { motion } from "framer-motion";

interface Student {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

const TrainerWorkouts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).maybeSingle();
      if (!trainer) {
        setLoading(false);
        return;
      }

      const [{ data: rawSts }, { data: grs }] = await Promise.all([
        supabase.from("students").select("id, user_id").eq("trainer_id", trainer.id).eq("active", true),
        supabase.from("groups").select("id, name").eq("trainer_id", trainer.id).order("name"),
      ]);

      if (rawSts && rawSts.length > 0) {
        const userIds = rawSts.map((s) => s.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
        const pMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);
        setStudents(
          rawSts
            .map((s) => ({ id: s.id, name: pMap.get(s.user_id) || "Sem nome" }))
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
        );
      } else {
        setStudents([]);
      }
      if (grs) setGroups(grs as Group[]);
      setLoading(false);
    };
    init();
  }, [user]);

  const q = search.trim().toLowerCase();
  const filteredStudents = useMemo(
    () => students.filter((s) => !q || s.name.toLowerCase().includes(q)),
    [students, q],
  );
  const filteredGroups = useMemo(
    () => groups.filter((g) => !q || g.name.toLowerCase().includes(q)),
    [groups, q],
  );

  return (
    <div className="space-y-10 pb-12 pt-6">
      <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-card p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-[0.24em]">
            <Dumbbell className="w-3 h-3" />
            Protocol Distribution
          </div>
          <h1 className="font-display text-5xl font-normal leading-[0.92] tracking-[-0.06em] text-foreground md:text-[4.25rem]">
            Treinos por <span className="text-primary">contexto</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/trainer/atletas")}
            className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-6 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65 transition-all hover:border-primary/40 hover:text-primary"
          >
            <Users className="w-4 h-4" /> Atletas
          </button>
          <button
            onClick={() => navigate("/trainer/grupos")}
            className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-6 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65 transition-all hover:border-primary/40 hover:text-primary"
          >
            <Layers className="w-4 h-4" /> Grupos
          </button>
        </div>
      </div>

      {/* ── SEARCH CONTROL ── */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atletas ou grupos..."
          className="h-14 w-full rounded-lg border border-border bg-card pl-14 pr-6 text-sm text-foreground placeholder:text-muted-foreground/65 transition-all focus:border-primary focus:bg-white focus:outline-none"
        />
      </div>

      {/* ── ROUTING GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* ATHLETE LISTING */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
             <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">Atletas Individuais</div>
             <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/80 bg-background/70" />)
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-border bg-background p-16 text-center text-xs font-medium uppercase tracking-widest text-foreground/25">
                Nenhum atleta identificado
              </div>
            ) : (
              filteredStudents.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30"
                >
                  <div className="min-w-0">
                     <span className="block truncate font-display text-2xl font-normal tracking-[-0.04em] text-foreground transition-colors group-hover:text-primary">{s.name}</span>
                     <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-foreground/28">Athlete Node ID: {s.id.substring(0,8).toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/trainer/atletas/${s.id}/treinos`)}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-5 font-mono text-[9px] uppercase tracking-[0.16em] text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Calendário
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* GROUP LISTING */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
             <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">Células Operacionais</div>
             <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/80 bg-background/70" />)
            ) : filteredGroups.length === 0 ? (
              <div className="rounded-xl border border-border bg-background p-16 text-center text-xs font-medium uppercase tracking-widest text-foreground/25">
                Nenhum grupo operacional detectado
              </div>
            ) : (
              filteredGroups.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30"
                >
                  <div className="min-w-0">
                     <span className="block truncate font-display text-2xl font-normal tracking-[-0.04em] text-foreground transition-colors group-hover:text-primary">{g.name}</span>
                     <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-foreground/28">Group Cluster ID: {g.id.substring(0,8).toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/trainer/grupos/${g.id}/treinos`)}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-5 font-mono text-[9px] uppercase tracking-[0.16em] text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Calendário
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrainerWorkouts;
