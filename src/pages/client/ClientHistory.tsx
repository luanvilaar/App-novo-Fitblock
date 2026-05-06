import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Activity, CalendarClock, ChevronRight, Clock3, History } from "lucide-react";

import {
  StudentEmptyState,
  StudentPageSection,
  StudentPill,
  StudentSectionHeading,
  StudentStatCard,
  StudentSurfaceCard,
} from "@/components/client/StudentPagePrimitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
      if (!student) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("workout_logs")
        .select("id, completed_at, total_time_seconds, workouts(id, title, category, date)")
        .eq("student_id", student.id)
        .order("completed_at", { ascending: false })
        .limit(50);

      setLogs((data as LogEntry[]) ?? []);
      setLoading(false);
    };
    void fetch();
  }, [user]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalSessions = logs.length;
  const averageDuration = useMemo(() => {
    const valid = logs.filter((log) => log.total_time_seconds && log.total_time_seconds > 0);
    if (valid.length === 0) return null;
    const avg = Math.round(valid.reduce((sum, log) => sum + (log.total_time_seconds ?? 0), 0) / valid.length);
    return formatDuration(avg);
  }, [logs]);

  return (
    <StudentPageSection>
      <StudentSurfaceCard className="p-6 sm:p-8" tone="strong">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <StudentPill>Revisão</StudentPill>
            <div className="space-y-2">
              <h1 className="font-display text-4xl text-black sm:text-5xl">Histórico de sessões</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-black/58 sm:text-base">
                Aqui o atleta revisa treinos concluídos em modo leitura. Não existe mais retorno acidental para o fluxo operacional da sessão.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/sessao">Abrir sessão atual</Link>
              </Button>
              <Button asChild variant="primary-pill" className="h-12 px-6">
                <Link to="/dashboard/evolucao">Ver evolução</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StudentStatCard eyebrow="Sessões" value={totalSessions} label="treinos registrados" icon={History} />
            <StudentStatCard eyebrow="Média" value={averageDuration ?? "—"} label="tempo médio de sessão" icon={Clock3} accent />
            <StudentStatCard
              eyebrow="Última revisão"
              value={logs[0] ? format(new Date(logs[0].completed_at), "dd MMM", { locale: ptBR }) : "—"}
              label="sessão mais recente"
              icon={CalendarClock}
            />
          </div>
        </div>
      </StudentSurfaceCard>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <StudentSurfaceCard key={i} className="h-24 animate-pulse bg-[#f3f3f3]" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <StudentEmptyState
          icon={Activity}
          title="Nenhum treino concluído ainda"
          description="Feche sua primeira sessão para liberar a área de revisão."
          action={
            <Button asChild variant="primary-pill" className="h-12 px-6">
              <Link to="/dashboard/sessao">Abrir sessão</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => {
            const workoutId = log.workouts?.id;
            if (!workoutId) return null;

            return (
              <Link key={log.id} to={`/dashboard/revisao/${workoutId}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group"
                >
                  <StudentSurfaceCard className="p-5 transition-transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-black/8 bg-[#efefef] text-black">
                        <History className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-black/40">
                          <span>{format(new Date(log.completed_at), "dd MMM yyyy", { locale: ptBR })}</span>
                          {log.workouts?.category ? <span>{log.workouts.category}</span> : null}
                        </div>
                        <p className="mt-1 truncate text-base font-semibold text-black">{log.workouts?.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-black/45">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {format(new Date(log.workouts.date), "EEEE, dd MMM", { locale: ptBR })}
                          </span>
                          {log.total_time_seconds ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDuration(log.total_time_seconds)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <StudentPill className="hidden sm:inline-flex">Revisar</StudentPill>
                        <ChevronRight className="h-5 w-5 text-black/28 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </StudentSurfaceCard>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      <StudentSurfaceCard className="p-6 sm:p-8">
        <StudentSectionHeading
          eyebrow="Fluxo correto"
          title="Treino e revisão agora têm papéis diferentes."
          description="Sessão serve para registrar execução. Histórico serve para consultar o que já foi feito. Isso reduz erro de navegação e mantém foco em cada contexto."
          action={
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/sessao">Treinar agora</Link>
              </Button>
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/treinadores">Ver comunidade</Link>
              </Button>
            </div>
          }
        />
      </StudentSurfaceCard>
    </StudentPageSection>
  );
};

export default ClientHistory;
