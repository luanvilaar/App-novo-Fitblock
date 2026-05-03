import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  isSameDay,
  getISOWeek,
  startOfDay,
  differenceInCalendarWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  BarChart2,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Dumbbell,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGroupRanking } from "@/hooks/useGroupRanking";
import { useConsistencySnapshot } from "@/hooks/useConsistencySnapshot";
import MaxLoadsModal from "@/components/client/MaxLoadsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyVolumePanel from "@/components/client/WeeklyVolumePanel";
import { TrainerPanelCard } from "@/components/trainer/TrainerPanelCard";
import { StudentPeriodizationStrip } from "@/components/client/StudentPeriodizationStrip";
import { normalizeWeekStartMonday } from "@/lib/training-periodization";
import { aggregateWeeklyConditioningVolume } from "@/lib/weekly-volume";
import { fetchStudentWorkoutsInRange } from "@/lib/student-workouts";
import { cn } from "@/lib/utils";
import heroBg from "@/assets/hero-bg.jpg";

interface WorkoutWithExercises {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string | null;
  workout_exercises: { id: string }[];
}

interface WorkoutLogRow {
  workout_id: string;
}

const GroupRankingCard = ({ groupId, groupName, studentId }: { groupId: string; groupName: string; studentId: string }) => {
  const { ranking, loading } = useGroupRanking(groupId);
  if (loading || ranking.length === 0) return null;

  const top5 = ranking.slice(0, 5);
  const myPosition = ranking.findIndex((r) => r.student_id === studentId);

  const medalIcon = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return `${pos + 1}º`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <TrainerPanelCard compact eyebrow="Ranking · 30 dias" title={groupName} subtitle="Desempenho no grupo">
        <div className="mt-4 space-y-4">
          {top5.map((m, i) => (
            <div
              key={m.student_id}
              className={cn(
                "flex items-center justify-between gap-4 rounded-full px-6 py-4 transition-all",
                m.student_id === studentId
                  ? "bg-[#f3f3f3] ring-1 ring-black/5"
                  : "bg-transparent hover:bg-black/[0.02]",
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                  {medalIcon(i)}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate font-sans text-base font-bold text-black",
                      m.student_id !== studentId && "opacity-80"
                    )}
                  >
                    {m.name.toLowerCase()}
                    {m.student_id === studentId && (
                      <span className="ml-1.5 opacity-60">· Você</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-sans text-2xl font-bold leading-none text-black">
                  {Math.round(m.score)}
                </p>
                <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[1.4px] opacity-40">
                  pontos
                </p>
              </div>
            </div>
          ))}
        </div>

        {myPosition >= 5 && (
          <div className="mt-8 flex items-center justify-between rounded-full bg-black px-6 py-4 text-white">
            <span className="font-sans text-xs font-medium opacity-60">Sua posição</span>
            <span className="font-sans text-sm font-bold">
              {myPosition + 1}º · {Math.round(ranking[myPosition].score)} pts
            </span>
          </div>
        )}
      </TrainerPanelCard>
    </motion.div>
  );
};

const ClientHome = () => {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekWorkouts, setWeekWorkouts] = useState<WorkoutWithExercises[]>([]);
  /** Semana civil atual (seg–dom), independente do deslocamento usado em Volume. */
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(new Set());
  const [maxLoadsOpen, setMaxLoadsOpen] = useState(false);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  const [upcomingPending, setUpcomingPending] = useState(0);
  const [maxLoadRowCount, setMaxLoadRowCount] = useState(0);

  const primaryGroup = groups[0] ?? null;
  const { snapshot: consistencySnapshot, loading: consistencyLoading, error: consistencyError } = useConsistencySnapshot(
    studentId,
    primaryGroup,
  );

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const calendarWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const calendarWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekDays = eachDayOfInterval({ start: calendarWeekStart, end: calendarWeekEnd });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle();
      if (profile) setProfileName(profile.name);

      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (student) {
        setStudentId(student.id);
        const { data: memberships } = await supabase.from("group_members").select("group_id").eq("student_id", student.id);
        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map((m) => m.group_id);
          const { data: grps } = await supabase.from("groups").select("id, name").in("id", groupIds);
          if (grps) setGroups(grps);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    const fetchWeek = async () => {
      const offsetStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const offsetEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const startStr = format(offsetStart, "yyyy-MM-dd");
      const endStr = format(offsetEnd, "yyyy-MM-dd");
      const thisStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const groupIds = groups.map((g) => g.id);

      const sameAsThisWeek = startStr === thisStart && endStr === thisEnd;
      const offsetWorkouts = (await fetchStudentWorkoutsInRange(
        supabase,
        studentId,
        groupIds,
        startStr,
        endStr
      )) as WorkoutWithExercises[];

      const currentWeekRows = sameAsThisWeek
        ? offsetWorkouts
        : ((await fetchStudentWorkoutsInRange(
            supabase,
            studentId,
            groupIds,
            thisStart,
            thisEnd
          )) as WorkoutWithExercises[]);

      setWeekWorkouts(offsetWorkouts);
      setThisWeekWorkouts(currentWeekRows);

      const idSet = new Set<string>();
      offsetWorkouts.forEach((w) => idSet.add(w.id));
      currentWeekRows.forEach((w) => idSet.add(w.id));
      const ids = [...idSet];
      if (ids.length > 0) {
        const { data: logs } = await supabase
          .from("workout_logs")
          .select("workout_id")
          .eq("student_id", studentId)
          .in("workout_id", ids);
        if (logs) setCompletedWorkoutIds(new Set((logs as WorkoutLogRow[]).map((l) => l.workout_id)));
        else setCompletedWorkoutIds(new Set());
      } else {
        setCompletedWorkoutIds(new Set());
      }
    };
    fetchWeek();
  }, [studentId, weekOffset, groups]);

  useEffect(() => {
    if (!studentId) {
      setMaxLoadRowCount(0);
      return;
    }
    void (async () => {
      const { count, error } = await supabase
        .from("student_max_loads")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      if (!error) setMaxLoadRowCount(count ?? 0);
    })();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) {
      setUpcomingTotal(0);
      setUpcomingPending(0);
      return;
    }
    const run = async () => {
      const fromStr = format(startOfDay(new Date()), "yyyy-MM-dd");
      const groupIds = groups.map((g) => g.id);
      const rows = await fetchStudentWorkoutsInRange(supabase, studentId, groupIds, fromStr);
      const ids = rows.map((w) => w.id);
      if (ids.length === 0) {
        setUpcomingTotal(0);
        setUpcomingPending(0);
        return;
      }
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("workout_id")
        .eq("student_id", studentId)
        .in("workout_id", ids);
      const done = new Set((logs as WorkoutLogRow[] | null)?.map((l) => l.workout_id) || []);
      const pending = ids.filter((id) => !done.has(id)).length;
      setUpcomingTotal(ids.length);
      setUpcomingPending(pending);
    };
    run();
  }, [studentId, groups]);

  const getThisWeekWorkoutsForDay = (day: Date) =>
    thisWeekWorkouts.filter((w) => isSameDay(new Date(w.date + "T12:00:00"), day));

  const weeklyVolumeRows = useMemo(
    () => aggregateWeeklyConditioningVolume(weekWorkouts),
    [weekWorkouts],
  );
  const weekVolumeLabel = `SEMANA ${getISOWeek(currentWeekStart)}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-white text-black px-safe pb-32 pt-safe">
      <div className="mx-auto max-w-4xl space-y-12 py-8 px-4 sm:py-12 sm:px-6">
        <header className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Dashboard</p>
            <div className="space-y-1">
              <p className="font-sans text-lg font-medium text-[#4b4b4b]">{getGreeting()},</p>
              <h1 className="line-clamp-2 break-words font-sans text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-7xl">
                {profileName || "Atleta"}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button 
              onClick={() => setMaxLoadsOpen(true)}
              className="flex h-14 items-center gap-2 rounded-full bg-[#efefef] px-8 text-sm font-bold text-black transition-all hover:bg-[#e2e2e2] active:scale-95"
            >
              <TrendingUp className="h-4 w-4" />
              Cargas
            </button>
          </div>
        </header>

        <div className="space-y-12">
          {/* Quick Stats App Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] bg-white p-6 ring-1 ring-black/5 transition-all hover:ring-black/10">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-[#afafaf]">
                <Dumbbell className="h-3.5 w-3.5 text-black" />
                Semana
              </div>
              <p className="mt-4 font-sans text-4xl font-black tracking-tighter text-black">{upcomingTotal}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4b4b4b]/60">Protocolos ativos</p>
            </div>
            <div className="rounded-[2rem] bg-white p-6 ring-1 ring-black/5 transition-all hover:ring-black/10">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-[#afafaf]">
                <Check className="h-3.5 w-3.5 text-black" />
                Status
              </div>
              <p className="mt-4 font-sans text-4xl font-black tracking-tighter text-black">
                {upcomingTotal > 0 ? Math.round(((upcomingTotal - upcomingPending) / upcomingTotal) * 100) : 0}%
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4b4b4b]/60">Concluído</p>
            </div>
          </div>

          {/* Agenda da Semana App Style */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xl font-black tracking-tight text-black">Agenda da Semana</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1.4px] text-black/30">
                <Activity className="h-3.5 w-3.5" />
                {format(new Date(), "MMMM", { locale: ptBR })}
              </div>
            </div>

            <div className="space-y-3">
              {thisWeekWorkouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-[2rem] bg-[#f3f3f3] ring-1 ring-black/5">
                  <p className="text-sm font-bold text-black/20">Nenhum treino para esta semana.</p>
                </div>
              ) : (
                thisWeekWorkouts.map((workout, i) => {
                  const isToday = workout.date === new Date().toISOString().split('T')[0];
                  const isDone = completedWorkoutIds.has(workout.id);
                  
                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group cursor-pointer flex items-center justify-between rounded-[2rem] p-6 transition-all",
                        isToday 
                          ? "bg-black text-white shadow-2xl ring-1 ring-white/10" 
                          : "bg-[#f3f3f3] text-black ring-1 ring-black/5 hover:bg-[#e2e2e2]"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-sans text-lg font-black",
                          isToday ? "bg-white text-black" : "bg-black text-white"
                        )}>
                          {format(new Date(workout.date + "T12:00:00"), "dd")}
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            "font-mono text-[10px] font-bold uppercase tracking-[1.4px]",
                            isToday ? "text-white/40" : "text-black/30"
                          )}>
                            {format(new Date(workout.date + "T12:00:00"), "EEEE", { locale: ptBR })}
                          </p>
                          <h3 className={cn(
                            "truncate font-sans text-xl font-black tracking-tight",
                            isDone && !isToday && "text-black/20 line-through"
                          )}>
                            {workout.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {isDone ? (
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            isToday ? "bg-white/20" : "bg-black/10"
                          )}>
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </div>
                        ) : (
                          <ChevronRight className={cn(
                            "h-6 w-6 opacity-20 transition-transform group-hover:translate-x-1",
                            isToday && "opacity-100"
                          )} strokeWidth={3} />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </section>

          {/* Ranking / Grupos */}
          {studentId && groups.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-xl font-black tracking-tight text-black">Seus Grupos</h2>
                <Trophy className="h-5 w-5 text-black/20" />
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {groups.map((g) => (
                  <GroupRankingCard key={g.id} groupId={g.id} groupName={g.name} studentId={studentId} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {studentId && (
        <MaxLoadsModal
          open={maxLoadsOpen}
          onOpenChange={setMaxLoadsOpen}
          studentId={studentId}
        />
      )}
    </div>
  );
};

export default ClientHome;
