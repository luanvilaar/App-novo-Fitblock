import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Calendar, Activity, Radar, Cpu } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import PremiumPerformanceChart from "@/components/PremiumPerformanceChart";

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

const ClientProgress = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progressData, setProgressData] = useState<ProgressPoint[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([]);
  const [monthlyFrequency, setMonthlyFrequency] = useState<MonthlyFrequency[]>([]);
  const [weekComparison, setWeekComparison] = useState<{ label: string; sets: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from("exercises").select("id, name").order("name");
      if (data) setExercises(data);
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchStudent = async () => {
      const { data } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (data) setStudentId(data.id);
    };
    fetchStudent();
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    const fetchAggregates = async () => {
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("id, completed_at")
        .eq("student_id", studentId)
        .order("completed_at");

      if (!logs || logs.length === 0) return;

      const monthMap: Record<string, number> = {};
      logs.forEach((l) => {
        const d = new Date(l.completed_at);
        const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        monthMap[key] = (monthMap[key] || 0) + 1;
      });
      setMonthlyFrequency(Object.entries(monthMap).map(([month, sessions]) => ({ month, sessions })));

      const logIds = logs.map((l) => l.id);
      const { data: exLogs } = await supabase
        .from("exercise_logs")
        .select("workout_log_id, load_used, reps_done, created_at")
        .in("workout_log_id", logIds.slice(0, 500));

      if (exLogs) {
        const weekMap: Record<string, number> = {};
        exLogs.forEach((el) => {
          const d = new Date(el.created_at);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const key = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
          const vol = (Number(el.load_used) || 0) * (el.reps_done || 0);
          weekMap[key] = (weekMap[key] || 0) + vol;
        });
        setWeeklyVolume(Object.entries(weekMap).map(([week, volume]) => ({ week, volume: Math.round(volume) })));

        const now = new Date();
        const weeks: { label: string; sets: number }[] = [];
        for (let i = 3; i >= 0; i--) {
          const start = new Date(now);
          start.setDate(now.getDate() - (i + 1) * 7);
          const end = new Date(now);
          end.setDate(now.getDate() - i * 7);
          const count = exLogs.filter((el) => {
            const d = new Date(el.created_at);
            return d >= start && d < end;
          }).length;
          weeks.push({ label: `Sem ${4 - i}`, sets: count });
        }
        setWeekComparison(weeks);
      }
    };
    fetchAggregates();
  }, [studentId]);

  useEffect(() => {
    if (!selectedExercise || !studentId) return;
    const fetchProgress = async () => {
      setLoading(true);
      const { data: studentLogs } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("student_id", studentId);
      const validLogIds = new Set(studentLogs?.map((l) => l.id));

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("load_used, created_at, workout_log_id")
        .eq("exercise_id", selectedExercise)
        .not("load_used", "is", null)
        .order("created_at");

      if (logs && logs.length > 0) {
        const points: ProgressPoint[] = logs
          .filter((l) => validLogIds.has(l.workout_log_id))
          .map((l) => ({
            date: new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
            load: Number(l.load_used),
          }));

        const grouped: Record<string, number> = {};
        points.forEach((p) => {
          grouped[p.date] = Math.max(grouped[p.date] || 0, p.load);
        });
        setProgressData(Object.entries(grouped).map(([date, load]) => ({ date, load })));
      } else {
        setProgressData([]);
      }
      setLoading(false);
    };
    fetchProgress();
  }, [selectedExercise, studentId]);

  const chartColors = {
    stroke: "hsl(141, 76%, 48%)",
    fill: "hsl(141, 76%, 48%)",
    grid: "hsla(0, 0%, 100%, 0.08)",
    text: "hsla(0, 0%, 100%, 0.62)",
    tooltipBg: "hsl(0, 0%, 10%)",
    tooltipBorder: "hsla(0, 0%, 100%, 0.12)",
  };

  const tooltipStyle = {
    background: chartColors.tooltipBg,
    border: `1px solid ${chartColors.tooltipBorder}`,
    borderRadius: "12px",
    color: "hsl(0, 0%, 100%)",
    fontSize: "12px",
  };

  const ChartCard = ({ title, icon: Icon, children, delay = 0 }: { title: string; icon: any; children: React.ReactNode; delay?: number }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card-vektor p-6 mb-6 clip-cut-corner-sm bg-foreground/[0.02]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border border-border flex items-center justify-center clip-cut-corner-sm">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h3 className="font-display text-sm uppercase tracking-tight">{title}</h3>
          <p className="font-mono text-[7px] uppercase tracking-widest text-muted-foreground">DATA_ANALYSIS</p>
        </div>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-10 pb-24">
      
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2 border-b border-border pb-6">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary flex items-center gap-2">
          <TrendingUp className="w-3 h-3" /> PERFORMANCE_ANALYTICS
        </div>
        <h1 className="font-display text-3xl uppercase tracking-tighter">
          Evolução // <span className="text-primary italic">METRICS</span>
        </h1>
        <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
          Análise de progressão e desempenho nos treinos
        </p>
      </motion.div>

      {monthlyFrequency.length > 0 && (
        <ChartCard title="Frequência Mensal" icon={Calendar}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyFrequency} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: chartColors.text }} />
              <YAxis tick={{ fontSize: 9, fill: chartColors.text }} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sessions" fill={chartColors.fill} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {weeklyVolume.length > 0 && (
        <ChartCard title="Volume Semanal (kg × reps)" icon={BarChart3} delay={0.1}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyVolume} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: chartColors.text }} />
              <YAxis tick={{ fontSize: 9, fill: chartColors.text }} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="hsl(141, 76%, 48%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {weekComparison.length > 0 && (
        <ChartCard title="Comparação entre Semanas" icon={Activity} delay={0.2}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekComparison} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: chartColors.text }} />
              <YAxis tick={{ fontSize: 9, fill: chartColors.text }} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sets" fill="hsl(245, 58%, 52%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Exercise-specific load progression */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <Radar className="w-3 h-3 text-primary" /> EXERCISE_SPECIFIC_TRACKING
        </div>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full h-12 border border-border bg-secondary/30 px-4 font-mono text-xs uppercase tracking-wider text-foreground focus:border-primary focus:outline-none transition-all"
        >
          <option value="">SELECIONE UM EXERCÍCIO</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name.toUpperCase()}</option>
          ))}
        </select>

        {selectedExercise && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {loading ? (
              <div className="h-64 card-vektor animate-pulse clip-cut-corner-sm" />
            ) : progressData.length === 0 ? (
              <div className="card-vektor p-12 text-center opacity-30 flex flex-col items-center justify-center gap-4 clip-cut-corner-sm">
                <Cpu className="w-8 h-8" />
                <p className="font-mono text-[10px] uppercase tracking-widest">Nenhum dado de carga registrado</p>
              </div>
            ) : (
              <PremiumPerformanceChart 
                data={progressData} 
                exerciseName={exercises.find(ex => ex.id === selectedExercise)?.name} 
              />
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ClientProgress;
