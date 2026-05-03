import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Dumbbell, Clock, Cpu, Activity } from "lucide-react";
import { Link } from "react-router-dom";

interface LogEntry {
  id: string;
  completed_at: string;
  total_time_seconds: number | null;
  workouts: { id: string; title: string; category: string; date: string } | null;
}

const ClientHistory = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase
        .from("workout_logs")
        .select("id, completed_at, total_time_seconds, workouts(id, title, category, date)")
        .eq("student_id", student.id)
        .order("completed_at", { ascending: false })
        .limit(50);
      if (data) setLogs(data as LogEntry[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-10 pb-24">
      
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
          <Activity className="w-3 h-3" /> ACTIVITY_LOG
        </div>
        <h1 className="font-display text-3xl font-normal tracking-[-0.05em] text-foreground">
          Histórico de treinos
        </h1>
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
          Registro de protocolos executados
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12 text-center opacity-30">
          <Cpu className="w-10 h-10" />
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-widest">Nenhum registro encontrado</p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Complete seu primeiro protocolo para iniciar o log</p>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          {logs.map((log, i) => (
            <Link key={log.id} to={`/dashboard/treino/${log.workouts?.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background transition-colors group-hover:border-primary group-hover:text-primary">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-display text-base font-normal tracking-[-0.03em] text-foreground transition-colors group-hover:text-primary">{log.workouts?.title}</p>
                      <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{format(new Date(log.completed_at), "dd MMM yyyy", { locale: ptBR })}</span>
                        {log.total_time_seconds && (
                          <>
                            <span className="opacity-30">//</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDuration(log.total_time_seconds)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ClientHistory;
