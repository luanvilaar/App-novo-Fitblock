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
        <div className="mt-2 space-y-2">
          {top5.map((m, i) => (
            <div
              key={m.student_id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                m.student_id === studentId
                  ? "border-primary/25 bg-primary/5"
                  : "border-border bg-background hover:border-primary/15",
              )}
            >
              <span
                className={cn(
                  "w-7 shrink-0 text-center font-display text-base font-normal",
                  m.student_id === studentId ? "text-foreground" : "text-primary",
                )}
              >
                {medalIcon(i)}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-body text-sm",
                    m.student_id === studentId ? "font-semibold text-foreground" : "text-foreground/80",
                  )}
                >
                  {m.name}
                  {m.student_id === studentId && <span className="ml-1 text-primary">· Você</span>}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    "block font-display text-base font-normal leading-none tracking-[-0.03em]",
                    m.student_id === studentId ? "text-foreground" : "text-primary",
                  )}
                >
                  {Math.round(m.score)}
                </span>
                <span className="font-mono text-[7px] uppercase tracking-widest text-muted-foreground">pontos</span>
              </div>
            </div>
          ))}
        </div>

        {myPosition >= 5 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 font-body text-xs text-foreground/80">
            <span className="text-muted-foreground">A sua posição</span>
            <span className="font-semibold text-primary">
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
    <div className="space-y-6 pb-6 pt-2 sm:space-y-8 sm:pb-10 md:space-y-10">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:gap-8 md:flex-row md:items-center md:justify-between md:p-8"
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-xl border border-border bg-background sm:self-center">
            <Activity className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">Dashboard</p>
            <p className="font-body text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="line-clamp-2 break-words font-display text-4xl font-normal tracking-[-0.06em] text-foreground sm:text-5xl md:text-[4rem] md:leading-[0.95]">
              {profileName || "Atleta"}
            </h1>
            <p className="max-w-md font-body text-sm text-muted-foreground">
              Treinos da semana, período de treinamento e volume num só lugar.
            </p>
          </div>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:items-stretch md:w-auto md:min-w-[18rem] md:max-w-md">
          <TrainerPanelCard compact className="min-h-[10rem] min-w-0 bg-background sm:min-w-0">
            <div className="flex h-full min-h-0 flex-col justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5 shrink-0 text-primary" />
                Agendados
              </div>
              <p className="font-display text-4xl font-normal tabular-nums leading-none tracking-[-0.05em] text-foreground">{upcomingTotal}</p>
              <p className="font-body text-xs text-muted-foreground">
                {upcomingPending === 0 ? "Tudo em dia" : `${upcomingPending} por fazer`}
              </p>
            </div>
          </TrainerPanelCard>
          <TrainerPanelCard
            compact
            className="min-h-[10rem] min-w-0 cursor-pointer select-none bg-background transition-all duration-200 active:scale-[0.98] hover:border-primary/20 hover:bg-primary/5 md:active:scale-100 sm:min-w-0"
            role="button"
            tabIndex={0}
            onClick={() => setMaxLoadsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMaxLoadsOpen(true);
              }
            }}
          >
            <div className="flex h-full min-h-0 flex-col justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary" />
                Cargas / 1RM
              </div>
              <p className="font-display text-4xl font-normal tabular-nums leading-none tracking-[-0.05em] text-foreground">{maxLoadRowCount}</p>
              <p className="font-body text-xs text-muted-foreground">
                {maxLoadRowCount === 0 ? "Ainda sem registos" : "Exercícios com carga registada"}
              </p>
            </div>
          </TrainerPanelCard>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card",
          "mx-auto aspect-[3/4] w-full max-w-[min(100%,18rem)] max-h-[min(68vh,28rem)] sm:max-h-none sm:max-w-xs",
          "md:mx-0 md:aspect-auto md:h-[min(16rem,32vw)] md:max-h-[18rem] lg:h-[min(17.5rem,28vw)] lg:max-h-[19rem] md:w-full md:max-w-none",
        )}
      >
        <img
          src={heroBg}
          alt=""
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-cover brightness-[0.92] contrast-[1.02] saturate-[0.82]",
            "object-center md:scale-105",
          )}
          loading="lazy"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_85%_at_50%_40%,transparent_25%,rgba(247,247,244,0.55)_100%)] md:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#f7f7f4]/90 via-[#f7f7f4]/26 to-transparent md:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#f7f7f4]/94 via-[#f7f7f4]/44 to-transparent md:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#f7f7f4]/72 via-transparent to-white/35 md:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_100%_120%_at_65%_50%,transparent_0%,rgba(51,33,74,0.12)_100%)] md:block"
          aria-hidden
        />
      </motion.div>

      <Tabs defaultValue="treinos" className="space-y-6 sm:space-y-8">
        <div className="-mx-1 border-b border-border/80 px-1 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-full min-w-0 flex-nowrap justify-start gap-x-4 overflow-x-auto overscroll-x-contain bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-8 md:gap-x-10 [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="treinos"
              className="shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground sm:text-[10px] sm:tracking-[0.2em] transition-transform active:scale-95 sm:active:scale-100"
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Dumbbell className="h-4 w-4 shrink-0" /> Treinos
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="inicio"
              className="shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground sm:text-[10px] sm:tracking-[0.2em] transition-transform active:scale-95 sm:active:scale-100"
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Cpu className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap sm:hidden">Período</span>
                <span className="hidden whitespace-nowrap sm:inline">Período de treinamento</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className="shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground sm:text-[10px] sm:tracking-[0.2em] transition-transform active:scale-95 sm:active:scale-100"
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <BarChart2 className="h-4 w-4 shrink-0" /> Volume
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="treinos" className="mt-0 focus-visible:outline-none">
          <TrainerPanelCard compact eyebrow="Agenda" title="Esta semana" subtitle="Treinos programados (segunda a domingo).">
            {loading ? (
              <div className="space-y-3 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg border border-border bg-background" />
                ))}
              </div>
            ) : thisWeekWorkouts.length === 0 ? (
              <p className="py-10 text-center font-body text-sm text-muted-foreground">
                Sem treinos agendados nesta semana.
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-border/80 border-t border-border/80">
                {thisWeekDays.map((day) => {
                  const dayList = getThisWeekWorkoutsForDay(day);
                  if (dayList.length === 0) return null;
                  const shortDow = format(day, "EEE", { locale: ptBR }).replace(".", "").slice(0, 3);
                  return (
                    <li key={day.toISOString()} className="py-4 first:pt-3">
                      <div className="flex items-baseline gap-3">
                        <span
                          className={cn(
                            "w-14 shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider",
                            isSameDay(day, new Date()) ? "text-primary" : "text-foreground/40",
                          )}
                        >
                          {shortDow} {format(day, "dd")}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          {dayList.map((w) => {
                            const done = completedWorkoutIds.has(w.id);
                            return (
                              <Link
                                key={w.id}
                                to={`/dashboard/treino/${w.id}`}
                                className="group flex min-h-11 items-center gap-2 rounded-lg border border-transparent py-2 transition-all duration-200 active:scale-[0.97] active:bg-primary/5 sm:min-h-0 sm:py-1 sm:active:scale-100 sm:active:bg-transparent md:hover:border-primary/15 md:hover:bg-background"
                              >
                                <span
                                  className={cn(
                                    "min-w-0 flex-1 truncate font-body text-sm",
                                    done ? "text-foreground/45 line-through decoration-foreground/25" : "text-foreground/90",
                                  )}
                                >
                                  {w.title}
                                </span>
                                {done ? (
                                  <Check className="h-4 w-4 shrink-0 text-emerald-400/90" strokeWidth={2.5} />
                                ) : (
                                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground/20 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/45" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TrainerPanelCard>
        </TabsContent>

        <TabsContent value="inicio" className="mt-0 space-y-10 focus-visible:outline-none">
          <StudentPeriodizationStrip
            studentId={studentId}
            onWeekSelect={(weekMonday) => {
              const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
              const clicked = normalizeWeekStartMonday(weekMonday);
              setWeekOffset(differenceInCalendarWeeks(clicked, baseMonday));
            }}
          />

          <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground md:text-[1.85rem]">Inspiração</h2>
              </div>
              <TrainerPanelCard
                compact
                className="overflow-hidden rounded-xl border border-border shadow-none"
                eyebrow="Comunidade"
                title="Histórias de consistência"
                subtitle="Os seus números reais (últimos 30 dias, comparado com os 30 dias anteriores). Sessões = treinos completos com todos os blocos e metcon."
            >
              <div className="space-y-6">
                <p className="font-body text-sm leading-relaxed text-muted-foreground">
                  Pequenos hábitos diários geram grandes mudanças. Em Treinos vê a semana atual; em Período de treinamento, as fases; em Volume, o condicionamento agregado.
                </p>
                {consistencyError ? (
                  <p className="font-body text-sm text-destructive">{consistencyError}</p>
                ) : null}
                <div className="space-y-4 border-t border-border/80 pt-6">
                  <div className="grid min-w-0 grid-cols-3 gap-x-1 border-b border-border/80 pb-3 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground sm:gap-x-2 sm:text-[9px]">
                    <span className="min-w-0">Métrica</span>
                    <span className="min-w-0 text-right">Antes</span>
                    <span className="min-w-0 text-right text-primary">Depois</span>
                  </div>
                  {consistencyLoading || !studentId ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="grid grid-cols-3 gap-2">
                          <div className="h-5 animate-pulse rounded bg-primary/8" />
                          <div className="h-5 animate-pulse rounded bg-primary/8" />
                          <div className="h-6 animate-pulse rounded bg-primary/8" />
                        </div>
                      ))}
                    </div>
                  ) : consistencySnapshot ? (
                    <>
                      {(() => {
                        const s = consistencySnapshot;
                        const rankLabel = primaryGroup
                          ? `Ranking (${primaryGroup.name.length > 18 ? `${primaryGroup.name.slice(0, 16)}…` : primaryGroup.name})`
                          : "Ranking (grupo)";
                        const rankAfter =
                          s.groupPosition != null && s.groupPoints != null
                            ? `${s.groupPosition}º · ${s.groupPoints} pts`
                            : "—";
                        const rows: { label: string; before: string; after: string }[] = [
                          {
                            label: "Sessões válidas",
                            before: String(s.sessionsPrev30),
                            after: String(s.sessionsLast30),
                          },
                          {
                            label: rankLabel,
                            before: "—",
                            after: rankAfter,
                          },
                          {
                            label: s.strengthMetricLabel,
                            before: s.strengthBefore,
                            after: s.strengthAfter,
                          },
                        ];
                        return rows.map((m) => (
                          <div
                            key={m.label}
                            className="grid min-w-0 grid-cols-3 items-baseline gap-x-1 gap-y-1 sm:gap-x-2"
                          >
                            <span className="min-w-0 break-words font-display text-xs font-normal tracking-[-0.02em] text-foreground sm:text-sm">
                              {m.label}
                            </span>
                            <span className="min-w-0 text-right font-mono text-[10px] text-foreground/45 sm:text-xs">{m.before}</span>
                            <span className="min-w-0 break-words text-right font-display text-base font-normal leading-none tracking-[-0.03em] text-primary sm:text-lg">
                              {m.after}
                            </span>
                          </div>
                        ));
                      })()}
                    </>
                  ) : null}
                </div>
                <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-muted-foreground/90">
                  Fonte: registos de treino e cargas na FitBlock. Não inclui peso corporal nem métricas subjetivas.
                </p>
              </div>
            </TrainerPanelCard>
          </div>

          {studentId && groups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground md:text-[1.85rem]">Os seus grupos</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {groups.map((g) => (
                  <GroupRankingCard key={g.id} groupId={g.id} groupName={g.name} studentId={studentId} />
                ))}
              </div>
            </div>
          )}

        </TabsContent>

        <TabsContent value="volume" className="mt-0 space-y-6 focus-visible:outline-none">
          <TrainerPanelCard
            compact
            eyebrow="Condicionamento"
            title="Volume semanal"
            subtitle="Mesma semana que o gráfico de fases em Período de treinamento. Ajuste a semana abaixo."
          >
            <div className="mb-6 flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
                <BarChart2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-body text-sm">Navegação</span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => setWeekOffset((p) => p - 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/70 transition-colors hover:border-primary/20 hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-0 max-w-full text-center font-mono text-[10px] uppercase tracking-widest text-foreground/80 sm:text-[11px]">
                  {format(currentWeekStart, "dd.MM")} — {format(currentWeekEnd, "dd.MM")}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekOffset((p) => p + 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/70 transition-colors hover:border-primary/20 hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="h-64 animate-pulse rounded-xl border border-border bg-background" />
            ) : (
              <WeeklyVolumePanel weekLabel={weekVolumeLabel} rows={weeklyVolumeRows} />
            )}
          </TrainerPanelCard>
        </TabsContent>
      </Tabs>

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
