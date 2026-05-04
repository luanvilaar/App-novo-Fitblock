import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addWeeks,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import MaxLoadsModal from "@/components/client/MaxLoadsModal";
import { StudentPeriodizationStrip } from "@/components/client/StudentPeriodizationStrip";
import WeeklyVolumePanel from "@/components/client/WeeklyVolumePanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useConsistencySnapshot } from "@/hooks/useConsistencySnapshot";
import { useGroupRanking } from "@/hooks/useGroupRanking";
import { supabase } from "@/integrations/supabase/client";
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

const medalLabel = (position: number) => {
  if (position === 0) return "🥇";
  if (position === 1) return "🥈";
  if (position === 2) return "🥉";
  return `${position + 1}º`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const SurfaceCard = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <div
    className={cn(
      "overflow-hidden rounded-[2rem] border border-black/6 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
      className,
    )}
  >
    {children}
  </div>
);

const MetricCard = ({
  eyebrow,
  value,
  label,
  detail,
  icon: Icon,
  accent = false,
}: {
  eyebrow: string;
  value: string;
  label: string;
  detail?: string;
  icon: typeof Activity;
  accent?: boolean;
}) => (
  <SurfaceCard className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">{eyebrow}</p>
        <div>
          <p className="font-display text-3xl text-black">{value}</p>
          <p className="mt-1 text-sm font-medium text-black/72">{label}</p>
        </div>
      </div>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl border border-black/6 bg-[#f3f3f3] text-black/64",
          accent && "bg-black text-white",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {detail ? <p className="mt-4 text-xs leading-relaxed text-black/50">{detail}</p> : null}
  </SurfaceCard>
);

const LoadingShell = () => (
  <div className="space-y-5">
    <SurfaceCard className="min-h-[220px] animate-pulse bg-[#f3f3f3]" />
    <div className="grid gap-4 md:grid-cols-2">
      <SurfaceCard className="min-h-[220px] animate-pulse bg-[#f3f3f3]" />
      <SurfaceCard className="min-h-[220px] animate-pulse bg-[#f3f3f3]" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <SurfaceCard key={index} className="min-h-[150px] animate-pulse bg-[#f3f3f3]" />
      ))}
    </div>
  </div>
);

const GroupRankingCard = ({
  groupId,
  groupName,
  studentId,
  featured = false,
}: {
  groupId: string;
  groupName: string;
  studentId: string;
  featured?: boolean;
}) => {
  const { ranking, loading } = useGroupRanking(groupId);

  if (loading) {
    return <SurfaceCard className="min-h-[280px] animate-pulse bg-[#f3f3f3]" />;
  }

  if (ranking.length === 0) {
    return (
      <SurfaceCard className="p-6">
        <div className="space-y-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Comunidade</p>
          <h3 className="font-display text-2xl text-black">{groupName}</h3>
          <p className="max-w-md text-sm leading-relaxed text-black/58">
            Ainda não há sessões suficientes para montar o ranking deste grupo.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  const myPosition = ranking.findIndex((member) => member.student_id === studentId);
  const myEntry = myPosition >= 0 ? ranking[myPosition] : null;
  const leaders = ranking.slice(0, featured ? 5 : 3);

  return (
    <SurfaceCard className="p-6"> 
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Comunidade</p>
            <h3 className="mt-2 font-display text-2xl text-black sm:text-3xl">{groupName}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-black/58">
              Ranking real dos últimos 30 dias, baseado nas sessões concluídas no app.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <Trophy className="h-5 w-5" />
          </div>
        </div>

        {myEntry ? (
          <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-black/45">Sua posição</p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="font-display text-5xl leading-none text-black">#{myPosition + 1}</span>
                  <span className="pb-1 text-sm font-medium text-black/64">de {ranking.length} atletas</span>
                </div>
              </div>
              <div className="rounded-2xl bg-black px-4 py-3 text-right text-white">
                <p className="font-display text-2xl">{Math.round(myEntry.score)}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">pontos</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black/82">Top do grupo</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/35">30 dias</p>
          </div>
          <div className="space-y-2.5">
            {leaders.map((member, index) => {
              const isMe = member.student_id === studentId;
              return (
                <div
                  key={member.student_id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-[1.35rem] border px-4 py-3",
                    isMe ? "border-black bg-black text-white" : "border-black/6 bg-[#f8f8f8]",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold", isMe ? "bg-white text-black" : "bg-black text-white")}>
                      {medalLabel(index)}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-semibold", isMe ? "text-white" : "text-black")}>
                        {member.name}
                        {isMe ? <span className="ml-1.5 text-white/72">• Você</span> : null}
                      </p>
                      <p className={cn("text-xs", isMe ? "text-white/42" : "text-black/42")}>{member.workouts_count} sessões válidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-display text-xl", isMe ? "text-white" : "text-black")}>{Math.round(member.score)}</p>
                    <p className={cn("font-mono text-[10px] uppercase tracking-[0.24em]", isMe ? "text-white/35" : "text-black/35")}>pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SurfaceCard>
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

  const refreshMaxLoadCount = useCallback(async (currentStudentId: string) => {
    const { count, error } = await supabase
      .from("student_max_loads")
      .select("id", { count: "exact", head: true })
      .eq("student_id", currentStudentId);

    if (!error) setMaxLoadRowCount(count ?? 0);
  }, []);

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
          const groupIds = memberships.map((membership) => membership.group_id);
          const { data: groupRows } = await supabase.from("groups").select("id, name").in("id", groupIds);
          if (groupRows) setGroups(groupRows);
        }

        await refreshMaxLoadCount(student.id);
      }

      setLoading(false);
    };

    void fetchData();
  }, [refreshMaxLoadCount, user]);

  useEffect(() => {
    if (!studentId) return;

    const fetchWeek = async () => {
      const offsetStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const offsetEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const startStr = format(offsetStart, "yyyy-MM-dd");
      const endStr = format(offsetEnd, "yyyy-MM-dd");
      const thisStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const groupIds = groups.map((group) => group.id);

      const sameAsThisWeek = startStr === thisStart && endStr === thisEnd;
      const offsetWorkouts = (await fetchStudentWorkoutsInRange(
        supabase,
        studentId,
        groupIds,
        startStr,
        endStr,
      )) as WorkoutWithExercises[];

      const currentWeekRows = sameAsThisWeek
        ? offsetWorkouts
        : ((await fetchStudentWorkoutsInRange(
            supabase,
            studentId,
            groupIds,
            thisStart,
            thisEnd,
          )) as WorkoutWithExercises[]);

      setWeekWorkouts(offsetWorkouts);
      setThisWeekWorkouts(currentWeekRows);

      const ids = [...new Set([...offsetWorkouts.map((workout) => workout.id), ...currentWeekRows.map((workout) => workout.id)])];
      if (ids.length === 0) {
        setCompletedWorkoutIds(new Set());
        return;
      }

      const { data: logs } = await supabase
        .from("workout_logs")
        .select("workout_id")
        .eq("student_id", studentId)
        .in("workout_id", ids);

      setCompletedWorkoutIds(new Set((logs as WorkoutLogRow[] | null)?.map((log) => log.workout_id) ?? []));
    };

    void fetchWeek();
  }, [groups, studentId, weekOffset]);

  useEffect(() => {
    if (!studentId) {
      setUpcomingTotal(0);
      setUpcomingPending(0);
      return;
    }

    const run = async () => {
      const fromStr = format(startOfDay(new Date()), "yyyy-MM-dd");
      const groupIds = groups.map((group) => group.id);
      const rows = await fetchStudentWorkoutsInRange(supabase, studentId, groupIds, fromStr);
      const ids = rows.map((workout) => workout.id);

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

      const done = new Set((logs as WorkoutLogRow[] | null)?.map((log) => log.workout_id) ?? []);
      const pending = ids.filter((id) => !done.has(id)).length;
      setUpcomingTotal(ids.length);
      setUpcomingPending(pending);
    };

    void run();
  }, [groups, studentId]);

  const weeklyVolumeRows = useMemo(() => aggregateWeeklyConditioningVolume(weekWorkouts), [weekWorkouts]);
  const weekVolumeLabel = `SEMANA ${getISOWeek(currentWeekStart)}`;
  const completionRate = upcomingTotal > 0 ? Math.round(((upcomingTotal - upcomingPending) / upcomingTotal) * 100) : 0;
  const completedThisWeek = thisWeekWorkouts.filter((workout) => completedWorkoutIds.has(workout.id)).length;
  const todayIso = format(new Date(), "yyyy-MM-dd");

  const spotlightWorkout = useMemo(() => {
    if (thisWeekWorkouts.length === 0) return null;

    const todayPending = thisWeekWorkouts.find(
      (workout) => workout.date === todayIso && !completedWorkoutIds.has(workout.id),
    );
    if (todayPending) return todayPending;

    const nextPending = thisWeekWorkouts.find((workout) => !completedWorkoutIds.has(workout.id));
    if (nextPending) return nextPending;

    return thisWeekWorkouts[0] ?? null;
  }, [completedWorkoutIds, thisWeekWorkouts, todayIso]);

  const secondaryWeekWorkouts = useMemo(
    () => thisWeekWorkouts.filter((workout) => workout.id !== spotlightWorkout?.id),
    [spotlightWorkout?.id, thisWeekWorkouts],
  );

  const consistencyDelta = consistencySnapshot
    ? consistencySnapshot.sessionsLast30 - consistencySnapshot.sessionsPrev30
    : null;
  const consistencyDeltaLabel =
    consistencyDelta == null
      ? "Carregando consistência"
      : consistencyDelta > 0
        ? `+${consistencyDelta} sessão${consistencyDelta > 1 ? "es" : ""} contra os 30 dias anteriores`
        : consistencyDelta < 0
          ? `${consistencyDelta} sessão${consistencyDelta < -1 ? "es" : ""} contra os 30 dias anteriores`
          : "Mesmo volume de sessões nos últimos 60 dias";

  if (loading) {
    return (
      <div className="min-h-screen px-safe pb-28 pt-2 text-black">
        <div className="mx-auto max-w-6xl">
          <LoadingShell />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-safe pb-28 pt-2 text-black">
      <div className="mx-auto max-w-6xl space-y-6">
        <SurfaceCard className="p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] xl:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-black/64">
                <span className="rounded-full bg-[#efefef] px-3 py-1 font-mono uppercase tracking-[0.24em]">
                  Dashboard do atleta
                </span>
                <span className="rounded-full bg-black px-3 py-1 font-mono uppercase tracking-[0.24em] text-white">
                  {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-lg font-medium text-black/72">{getGreeting()},</p>
                <h1 className="max-w-3xl font-display text-4xl leading-none text-black sm:text-5xl xl:text-6xl">
                  {profileName || "Atleta"}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-black/58 sm:text-base">
                  Sua home agora prioriza comunidade, sequência de treino e sinais reais de evolução dentro do app.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {spotlightWorkout ? (
                  <Button asChild variant="primary-pill" className="h-12 px-6">
                    <Link to={`/dashboard/treino/${spotlightWorkout.id}`}>Abrir treino em destaque</Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary-pill" className="h-12 px-6">
                    <Link to="/dashboard/treinadores">Explorar grupos e coaches</Link>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary-pill"
                  className="h-12 px-6"
                  onClick={() => setMaxLoadsOpen(true)}
                >
                  <TrendingUp className="h-4 w-4" />
                  Atualizar cargas
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="overflow-hidden rounded-[1.75rem] bg-[#f3f3f3]">
                <img src={heroBg} alt="" aria-hidden="true" className="h-48 w-full object-cover grayscale" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Grupo principal</p>
                  <p className="mt-3 font-display text-2xl text-black">{primaryGroup?.name ?? "Sem grupo"}</p>
                  <p className="mt-2 text-sm text-black/54">
                  {groups.length > 0 ? `${groups.length} grupo${groups.length > 1 ? "s" : ""} ativo${groups.length > 1 ? "s" : ""}` : "Sem comunidade conectada"}
                  </p>
                </div>

                <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Aderência</p>
                  <p className="mt-3 font-display text-4xl text-black">{completionRate}%</p>
                  <p className="mt-2 text-sm text-black/54">dos próximos protocolos já concluídos</p>
                </div>

                <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Sequência</p>
                  <p className="mt-3 font-display text-4xl text-black">{consistencySnapshot?.sessionsLast30 ?? 0}</p>
                  <p className="mt-2 text-sm text-black/54">sessões válidas nos últimos 30 dias</p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        {studentId && primaryGroup ? (
          <GroupRankingCard groupId={primaryGroup.id} groupName={primaryGroup.name} studentId={studentId} featured />
        ) : (
          <SurfaceCard className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Comunidade</p>
                <h2 className="mt-3 font-display text-3xl text-black">Entre em um grupo para liberar o ranking</h2>
                <p className="mt-3 text-sm leading-relaxed text-black/58">
                  O dashboard social aparece quando você entra em um grupo com sessões registradas. Até lá, a home continua focada na sua rotina de treino.
                </p>
              </div>
              <Button asChild variant="primary-pill" className="h-12 px-6">
                <Link to="/dashboard/treinadores">Encontrar treinadores</Link>
              </Button>
            </div>
          </SurfaceCard>
        )}

        {studentId && groups.length > 1 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {groups.slice(1).map((group) => (
              <GroupRankingCard key={group.id} groupId={group.id} groupName={group.name} studentId={studentId} />
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <SurfaceCard className="p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Semana em curso</p>
                  <h2 className="mt-2 font-display text-3xl text-black">Agenda de treino</h2>
                </div>
                <div className="rounded-full border border-black/8 bg-[#efefef] px-4 py-2 text-sm text-black/62">
                  {completedThisWeek}/{thisWeekWorkouts.length} concluídos
                </div>
              </div>

              {spotlightWorkout ? (
                <Link
                  to={`/dashboard/treino/${spotlightWorkout.id}`}
                  className="group rounded-[1.9rem] border border-black/8 bg-[#f3f3f3] p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                        <span className="rounded-full border border-black/8 bg-white px-3 py-1">
                          {spotlightWorkout.date === todayIso ? "Treino de hoje" : "Próximo treino"}
                        </span>
                        <span>{format(new Date(`${spotlightWorkout.date}T12:00:00`), "EEEE, dd MMM", { locale: ptBR })}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight text-black">{spotlightWorkout.title}</h3>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/58">
                          {spotlightWorkout.description || "Abra o treino para executar séries, registrar cargas e validar a sessão no ranking."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white px-4 py-3 text-right">
                        <p className="font-display text-2xl text-black">{spotlightWorkout.workout_exercises.length}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-black/40">exercícios</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition-transform group-hover:translate-x-1">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-[1.9rem] border border-dashed border-black/10 bg-[#f8f8f8] p-6 text-center">
                  <p className="font-display text-2xl text-black">Sem treino programado nesta semana</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/54">
                    Quando seu coach publicar um protocolo, ele aparece aqui com acesso direto para execução.
                  </p>
                </div>
              )}

              {secondaryWeekWorkouts.length > 0 ? (
                <div className="space-y-2.5">
                  {secondaryWeekWorkouts.map((workout, index) => {
                    const isDone = completedWorkoutIds.has(workout.id);
                    const isToday = isSameDay(new Date(`${workout.date}T12:00:00`), new Date());

                    return (
                      <motion.div
                        key={workout.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <Link
                          to={`/dashboard/treino/${workout.id}`}
                          className={cn(
                            "flex items-center justify-between gap-4 rounded-[1.45rem] border px-4 py-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            isDone ? "border-black/8 bg-[#f3f3f3] text-black/55" : "border-black/8 bg-white text-black hover:bg-[#f8f8f8]",
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-black/40">
                              <span>{format(new Date(`${workout.date}T12:00:00`), "EEE", { locale: ptBR })}</span>
                              {isToday ? <span className="text-black/58">Hoje</span> : null}
                              {isDone ? <span className="text-black/50">Concluído</span> : null}
                            </div>
                            <p className={cn("mt-1 truncate text-base font-semibold", isDone && "line-through")}>{workout.title}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-xs text-black/40">{workout.workout_exercises.length} ex.</span>
                            {isDone ? (
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                                <Check className="h-4 w-4" />
                              </span>
                            ) : (
                              <ChevronRight className="h-5 w-5 text-black/40" />
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              eyebrow="Consistência"
              value={consistencyLoading ? "..." : String(consistencySnapshot?.sessionsLast30 ?? 0)}
              label="sessões válidas nos últimos 30 dias"
              detail={consistencyError ? consistencyError : consistencyDeltaLabel}
              icon={Flame}
              accent
            />
            <MetricCard
              eyebrow="Força"
              value={consistencySnapshot?.strengthAfter ?? "—"}
              label={consistencySnapshot?.strengthMetricLabel ?? "Maior carga"}
              detail={
                consistencySnapshot?.hasStrengthData
                  ? `Antes: ${consistencySnapshot.strengthBefore} • Agora: ${consistencySnapshot.strengthAfter}`
                  : "Adicione cargas máximas para desbloquear comparativos reais de evolução."
              }
              icon={TrendingUp}
            />
            <MetricCard
              eyebrow="Execução"
              value={`${completedThisWeek}/${thisWeekWorkouts.length}`}
              label="treinos concluídos nesta semana"
              detail={`${upcomingPending} protocolo${upcomingPending === 1 ? "" : "s"} ainda pendente${upcomingPending === 1 ? "" : "s"}.`}
              icon={Target}
            />
            <MetricCard
              eyebrow="Base de carga"
              value={String(maxLoadRowCount)}
              label="exercícios com carga máxima salva"
              detail="Atualize seu 1RM para melhorar as sugestões de carga durante a execução do treino."
              icon={Dumbbell}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
          <SurfaceCard className="p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Ciclo</p>
                <h2 className="mt-2 font-display text-3xl text-black">Linha do mesociclo</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/6 bg-[#efefef] text-black/64">
                <CalendarRange className="h-5 w-5" />
              </div>
            </div>
            <StudentPeriodizationStrip studentId={studentId} groupId={primaryGroup?.id ?? null} />
          </SurfaceCard>

          <SurfaceCard className="p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Volume</p>
                <h2 className="mt-2 font-display text-3xl text-black">Condicionamento da semana</h2>
                <p className="mt-2 text-sm text-black/54">
                  {format(currentWeekStart, "dd MMM", { locale: ptBR })} - {format(currentWeekEnd, "dd MMM", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary-pill"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => setWeekOffset((previous) => previous - 1)}
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="rounded-full border border-black/8 bg-[#efefef] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">
                  {weekVolumeLabel}
                </div>
                <Button
                  type="button"
                  variant="secondary-pill"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => setWeekOffset((previous) => previous + 1)}
                  aria-label="Próxima semana"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <WeeklyVolumePanel weekLabel={weekVolumeLabel} rows={weeklyVolumeRows} />
          </SurfaceCard>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SurfaceCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Grupos</p>
                <p className="mt-3 font-display text-3xl text-black">{groups.length}</p>
              </div>
              <Users className="h-5 w-5 text-black/40" />
            </div>
          </SurfaceCard>
          <SurfaceCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Próximos protocolos</p>
                <p className="mt-3 font-display text-3xl text-black">{upcomingTotal}</p>
              </div>
              <Activity className="h-5 w-5 text-black/40" />
            </div>
          </SurfaceCard>
          <SurfaceCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Pontos atuais</p>
                <p className="mt-3 font-display text-3xl text-black">
                  {consistencySnapshot?.groupPoints != null ? Math.round(consistencySnapshot.groupPoints) : "—"}
                </p>
              </div>
              <Trophy className="h-5 w-5 text-black/40" />
            </div>
          </SurfaceCard>
          <SurfaceCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Resumo</p>
                <p className="mt-3 font-display text-3xl text-black">{completionRate}%</p>
              </div>
              <Sparkles className="h-5 w-5 text-black/40" />
            </div>
          </SurfaceCard>
        </div>
      </div>

      {studentId ? (
        <MaxLoadsModal
          open={maxLoadsOpen}
          onOpenChange={setMaxLoadsOpen}
          studentId={studentId}
          onSaved={() => void refreshMaxLoadCount(studentId)}
        />
      ) : null}
    </div>
  );
};

export default ClientHome;
