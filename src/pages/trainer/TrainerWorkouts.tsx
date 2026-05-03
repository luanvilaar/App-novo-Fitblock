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
    <div className="space-y-16 pb-32 pt-8 px-safe">
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Programação</p>
          <h1 className="font-sans text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-7xl">
            Protocolos.
          </h1>
        </div>
        
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => navigate("/trainer/atletas")}
            className="h-12 rounded-full border border-black/5 bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black/40 transition-all hover:bg-black hover:text-white"
          >
            Atletas
          </button>
          <button
            onClick={() => navigate("/trainer/grupos")}
            className="h-12 rounded-full border border-black/5 bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black/40 transition-all hover:bg-black hover:text-white"
          >
            Grupos
          </button>
        </div>
      </header>

      {/* ── SEARCH CONTROL ── */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atletas ou grupos..."
          className="h-14 w-full rounded-full border-black/5 bg-[#f3f3f3] pl-14 pr-8 text-sm font-bold text-black focus:border-black/10 focus:ring-0 outline-none"
        />
      </div>

      {/* ── ROUTING GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* ATHLETE LISTING */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
             <div className="font-sans text-xl font-black tracking-tight text-black">Atletas Individuais</div>
             <div className="h-px flex-1 bg-black/5" />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-[2rem] bg-[#f3f3f3]" />)
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-[2rem] border border-black/5 bg-white p-16 text-center shadow-sm">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black/20">Nenhum atleta identificado</p>
              </div>
            ) : (
              filteredStudents.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="group flex items-center justify-between gap-6 rounded-[2rem] border border-black/5 bg-white p-8 transition-all hover:ring-1 hover:ring-black/10 shadow-sm"
                >
                  <div className="min-w-0">
                     <span className="block truncate font-sans text-2xl font-black tracking-tight text-black transition-colors group-hover:text-black/70">{s.name.toLowerCase()}</span>
                     <span className="font-mono text-[9px] font-black uppercase tracking-widest text-black/30">Calendário individual</span>
                  </div>
                  <button
                    onClick={() => navigate(`/trainer/atletas/${s.id}/treinos`)}
                    className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-black text-white px-6 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                  >
                    <Calendar className="w-4 h-4" strokeWidth={3} /> Agenda
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* GROUP LISTING */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
             <div className="font-sans text-xl font-black tracking-tight text-black">Comunidades</div>
             <div className="h-px flex-1 bg-black/5" />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-[2rem] bg-[#f3f3f3]" />)
            ) : filteredGroups.length === 0 ? (
              <div className="rounded-[2rem] border border-black/5 bg-white p-16 text-center shadow-sm">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black/20">Nenhuma comunidade ativa</p>
              </div>
            ) : (
              filteredGroups.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="group flex items-center justify-between gap-6 rounded-[2rem] border border-black/5 bg-white p-8 transition-all hover:ring-1 hover:ring-black/10 shadow-sm"
                >
                  <div className="min-w-0">
                     <span className="block truncate font-sans text-2xl font-black tracking-tight text-black transition-colors group-hover:text-black/70">{g.name.toLowerCase()}</span>
                     <span className="font-mono text-[9px] font-black uppercase tracking-widest text-black/30">Calendário coletivo</span>
                  </div>
                  <button
                    onClick={() => navigate(`/trainer/grupos/${g.id}/treinos`)}
                    className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-black text-white px-6 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                  >
                    <Calendar className="w-4 h-4" strokeWidth={3} /> Agenda
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
