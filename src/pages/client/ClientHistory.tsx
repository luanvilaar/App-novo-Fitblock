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
    <div className="min-h-screen bg-white text-black space-y-8 pb-32">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
          Atividade
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-black">
          Histórico
        </h1>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#f3f3f3]" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-[#f3f3f3] p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
            <Activity className="h-8 w-8 text-black/20" />
          </div>
          <div className="space-y-1">
            <p className="font-sans text-sm font-bold">Nenhum treino ainda</p>
            <p className="font-sans text-xs text-black/40">Complete seu primeiro protocolo para ver o log.</p>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          {logs.map((log, i) => (
            <Link key={log.id} to={`/dashboard/treino/${log.workouts?.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative flex items-center gap-4 rounded-2xl bg-[#f3f3f3] p-5 transition-all active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <Dumbbell className="h-6 w-6" />
                </div>
                
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate font-sans text-base font-bold text-black">
                    {log.workouts?.title}
                  </h3>
                  <div className="flex items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-wider text-black/40">
                    <span>{format(new Date(log.completed_at), "dd MMM yyyy", { locale: ptBR })}</span>
                    {log.total_time_seconds && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-black/10" />
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(log.total_time_seconds)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-black/20 transition-transform group-hover:translate-x-1" />
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ClientHistory;
