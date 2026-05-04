import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  Clock3,
  Cpu,
  Radar,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  StudentEmptyState,
  StudentPageSection,
  StudentPill,
  StudentStatCard,
  StudentSurfaceCard,
} from "@/components/client/StudentPagePrimitives";
import PremiumPerformanceChart from "@/components/PremiumPerformanceChart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseOption {
  id: string;
  name: string;
}

interface ProgressPoint {
  date: string;
  load: number;
}

interface WeeklyVolume {
  week: string;
  volume: number;
}

interface MonthlyFrequency {
  month: string;
  sessions: number;
}

interface RecentLog {
  id: string;
  completed_at: string;
  total_time_seconds: number | null;
  workouts: { id: string; title: string } | null;
}

const ClientProgress = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progressData, setProgressData] = useState<ProgressPoint[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([]);
  const [monthlyFrequency, setMonthlyFrequency] = useState<MonthlyFrequency[]>([]);
  const [weekComparison, setWeekComparison] = useState<{ label: string; sets: number }[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from("exercises").select("id, name").order("name");
      if (data) setExercises(data);
    };
    void fetchExercises();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchStudent = async () => {
      const { data } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (data) setStudentId(data.id);
    };
    void fetchStudent();
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    const fetchAggregates = async () => {
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("id, completed_at")
        .eq("student_id", studentId)
        .order("completed_at");

      const { data: recent } = await supabase
        .from("workout_logs")
        .select("id, completed_at, total_time_seconds, workouts(id, title)")
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false })
        .limit(4);
      setRecentLogs((recent as RecentLog[]) ?? []);

      if (!logs || logs.length === 0) {
        setMonthlyFrequency([]);
        setWeeklyVolume([]);
        setWeekComparison([]);
        return;
      }

      const monthMap: Record<string, number> = {};
      logs.forEach((log) => {
        const date = new Date(log.completed_at);
        const key = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        monthMap[key] = (monthMap[key] || 0) + 1;
      });
      setMonthlyFrequency(Object.entries(monthMap).map(([month, sessions]) => ({ month, sessions })));

      const logIds = logs.map((log) => log.id);
      const { data: exLogs } = await supabase
        .from("exercise_logs")
        .select("workout_log_id, load_used, reps_done, created_at")
        .in("workout_log_id", logIds.slice(0, 500));

      if (exLogs) {
        const weekMap: Record<string, number> = {};
        exLogs.forEach((entry) => {
          const date = new Date(entry.created_at);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const key = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
          const volume = (Number(entry.load_used) || 0) * (entry.reps_done || 0);
          weekMap[key] = (weekMap[key] || 0) + volume;
        });
        setWeeklyVolume(Object.entries(weekMap).map(([week, volume]) => ({ week, volume: Math.round(volume) })));

        const now = new Date();
        const weeks: { label: string; sets: number }[] = [];
        for (let i = 3; i >= 0; i -= 1) {
          const start = new Date(now);
          start.setDate(now.getDate() - (i + 1) * 7);
          const end = new Date(now);
          end.setDate(now.getDate() - i * 7);
          const count = exLogs.filter((entry) => {
            const date = new Date(entry.created_at);
            return date >= start && date < end;
          }).length;
          weeks.push({ label: `Sem ${4 - i}`, sets: count });
        }
        setWeekComparison(weeks);
      }
    };
    void fetchAggregates();
  }, [studentId]);

  useEffect(() => {
    if (!selectedExercise || !studentId) return;
    const fetchProgress = async () => {
      setLoading(true);
      const { data: studentLogs } = await supabase.from("workout_logs").select("id").eq("student_id", studentId);
      const validLogIds = new Set(studentLogs?.map((log) => log.id));

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("load_used, created_at, workout_log_id")
        .eq("exercise_id", selectedExercise)
        .not("load_used", "is", null)
        .order("created_at");

      if (logs && logs.length > 0) {
        const points: ProgressPoint[] = logs
          .filter((log) => validLogIds.has(log.workout_log_id))
          .map((log) => ({
            date: new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
            load: Number(log.load_used),
          }));

        const grouped: Record<string, number> = {};
        points.forEach((point) => {
          grouped[point.date] = Math.max(grouped[point.date] || 0, point.load);
        });
        setProgressData(Object.entries(grouped).map(([date, load]) => ({ date, load })));
      } else {
        setProgressData([]);
      }
      setLoading(false);
    };
    void fetchProgress();
  }, [selectedExercise, studentId]);

  const totalSessions = monthlyFrequency.reduce((sum, row) => sum + row.sessions, 0);
  const averageWeekSets = weekComparison.length > 0
    ? Math.round(weekComparison.reduce((sum, row) => sum + row.sets, 0) / weekComparison.length)
    : 0;
  const strongestVolume = useMemo(
    () => weeklyVolume.reduce((max, row) => Math.max(max, row.volume), 0),
    [weeklyVolume],
  );

  const chartColors = {
    stroke: "#111111",
    fill: "#111111",
    grid: "rgba(17,17,17,0.08)",
    text: "rgba(17,17,17,0.42)",
    tooltipBg: "#ffffff",
    tooltipBorder: "rgba(17,17,17,0.08)",
  };

  const tooltipStyle = {
    background: chartColors.tooltipBg,
    border: `1px solid ${chartColors.tooltipBorder}`,
    borderRadius: "12px",
    color: "#111111",
    fontSize: "12px",
  };

  const ChartCard = ({
    title,
    icon: Icon,
    children,
    delay = 0,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    delay?: number;
  }) => (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <StudentSurfaceCard className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/6 bg-[#efefef]">
            <Icon className="h-4 w-4 text-black" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-display text-lg text-black">{title}</h3>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-black/40">athlete analytics</p>
          </div>
        </div>
        {children}
      </StudentSurfaceCard>
    </motion.div>
  );

  return (
    <StudentPageSection>
      <StudentSurfaceCard className="p-6 sm:p-8" tone="strong">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <StudentPill>Progress hub</StudentPill>
            <div className="space-y-2">
              <h1 className="font-display text-4xl text-black sm:text-5xl">Evolução e revisão</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-black/58 sm:text-base">
                Esta rota concentra analytics, leitura de progresso e atalhos para o histórico. Sessão operacional ficou separada na aba própria.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="primary-pill" className="h-12 px-6">
                <Link to="/dashboard/historico">Revisar histórico</Link>
              </Button>
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/sessao">Voltar para sessão</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StudentStatCard eyebrow="Sessões totais" value={totalSessions} label="treinos registrados" icon={Calendar} />
            <StudentStatCard eyebrow="Volume pico" value={strongestVolume || "—"} label="maior semana em kg x reps" icon={BarChart3} accent />
            <StudentStatCard eyebrow="Média de séries" value={averageWeekSets} label="por janela semanal" icon={Activity} />
          </div>
        </div>
      </StudentSurfaceCard>

      {monthlyFrequency.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <ChartCard title="Frequência mensal" icon={Calendar}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyFrequency} margin={{ left: -15, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: chartColors.text }} />
                <YAxis tick={{ fontSize: 9, fill: chartColors.text }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sessions" fill={chartColors.fill} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StudentSurfaceCard className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/6 bg-[#efefef]">
                <Clock3 className="h-4 w-4 text-black" />
              </div>
              <div>
                <h3 className="font-display text-lg text-black">Últimas revisões</h3>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-black/40">history shortcuts</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {recentLogs.map((log) => {
                const workoutId = log.workouts?.id;
                if (!workoutId) return null;

                return (
                  <Link
                    key={log.id}
                    to={`/dashboard/revisao/${workoutId}`}
                    className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-black/8 bg-[#f8f8f8] px-4 py-3 transition-colors hover:bg-[#efefef]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-black">{log.workouts?.title}</p>
                      <p className="mt-1 text-xs text-black/45">
                        {new Date(log.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-black/20" />
                  </Link>
                );
              })}
              {recentLogs.length === 0 ? <p className="text-sm text-black/45">Sem revisões recentes.</p> : null}
            </div>
          </StudentSurfaceCard>
        </div>
      ) : (
        <StudentEmptyState
          icon={Cpu}
          title="Ainda não há dados suficientes"
          description="Conclua algumas sessões para liberar comparativos e gráficos reais."
          action={
            <Button asChild variant="primary-pill" className="h-12 px-6">
              <Link to="/dashboard/sessao">Abrir sessão</Link>
            </Button>
          }
        />
      )}

      {weeklyVolume.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Volume semanal" icon={BarChart3} delay={0.1}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyVolume} margin={{ left: -15, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: chartColors.text }} />
                <YAxis tick={{ fontSize: 9, fill: chartColors.text }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="volume" fill="#111111" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Comparação entre semanas" icon={Activity} delay={0.2}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weekComparison} margin={{ left: -15, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: chartColors.text }} />
                <YAxis tick={{ fontSize: 9, fill: chartColors.text }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="sets" stroke="#111111" strokeWidth={3} dot={{ fill: "#111111", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-black/45">
          <Radar className="h-3.5 w-3.5 text-black" />
          Progressão por exercício
        </div>
        <StudentSurfaceCard className="p-6">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="h-12 w-full rounded-full border border-black/8 bg-[#f3f3f3] px-4 font-mono text-xs uppercase tracking-[0.18em] text-black outline-none transition-colors focus:border-black/25"
          >
            <option value="">Selecionar exercício</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name.toUpperCase()}
              </option>
            ))}
          </select>

          {selectedExercise ? (
            <div className="mt-6">
              {loading ? (
                <div className="h-64 animate-pulse rounded-[1.5rem] bg-[#f3f3f3]" />
              ) : progressData.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-black/8 bg-[#f8f8f8] p-12 text-center">
                  <Cpu className="h-8 w-8 text-black/20" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/45">Nenhum dado de carga registrado</p>
                </div>
              ) : (
                <PremiumPerformanceChart
                  data={progressData}
                  exerciseName={exercises.find((exercise) => exercise.id === selectedExercise)?.name}
                />
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-black/8 bg-[#f8f8f8] p-8 text-center">
              <p className="text-sm text-black/45">Escolha um exercício para abrir a leitura de progressão de carga.</p>
            </div>
          )}
        </StudentSurfaceCard>
      </motion.div>
    </StudentPageSection>
  );
};

export default ClientProgress;
