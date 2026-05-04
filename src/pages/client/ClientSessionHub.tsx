import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { endOfWeek, format, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Flame,
  PlayCircle,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  StudentPageSection,
  StudentPill,
  StudentSectionHeading,
  StudentStatCard,
  StudentSurfaceCard,
} from "@/components/client/StudentPagePrimitives";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchStudentWorkoutsInRange } from "@/lib/student-workouts";
import { cn } from "@/lib/utils";

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

const ClientSessionHub = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [weekWorkouts, setWeekWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const [{ data: profile }, { data: student }] = await Promise.all([
        supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle(),
        supabase.from("students").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      if (profile?.name) setProfileName(profile.name);
      if (!student?.id) {
        setLoading(false);
        return;
      }

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("student_id", student.id);

      const groupIds = memberships?.map((membership) => membership.group_id) ?? [];
      if (groupIds.length > 0) {
        const { data: groupRows } = await supabase.from("groups").select("id, name").in("id", groupIds);
        setGroups(groupRows ?? []);
      } else {
        setGroups([]);
      }

      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const workouts = (await fetchStudentWorkoutsInRange(
        supabase,
        student.id,
        groupIds,
        weekStart,
        weekEnd,
      )) as WorkoutWithExercises[];
      setWeekWorkouts(workouts);

      if (workouts.length > 0) {
        const { data: logs } = await supabase
          .from("workout_logs")
          .select("workout_id")
          .eq("student_id", student.id)
          .in(
            "workout_id",
            workouts.map((workout) => workout.id),
          );

        setCompletedWorkoutIds(new Set((logs as WorkoutLogRow[] | null)?.map((log) => log.workout_id) ?? []));
      } else {
        setCompletedWorkoutIds(new Set());
      }

      setLoading(false);
    };

    void load();
  }, [user]);

  const today = new Date();
  const todayIso = format(today, "yyyy-MM-dd");
  const featuredWorkout = useMemo(() => {
    const todayPending = weekWorkouts.find(
      (workout) => workout.date === todayIso && !completedWorkoutIds.has(workout.id),
    );
    if (todayPending) return todayPending;

    const nextPending = weekWorkouts.find((workout) => !completedWorkoutIds.has(workout.id));
    if (nextPending) return nextPending;

    return weekWorkouts[0] ?? null;
  }, [completedWorkoutIds, todayIso, weekWorkouts]);

  const pendingWorkouts = weekWorkouts.filter((workout) => !completedWorkoutIds.has(workout.id));
  const completedCount = weekWorkouts.length - pendingWorkouts.length;
  const adherence = weekWorkouts.length > 0 ? Math.round((completedCount / weekWorkouts.length) * 100) : 0;
  const primaryGroup = groups[0] ?? null;

  if (loading) {
    return (
      <div className="space-y-4 pb-10">
        <StudentSurfaceCard className="min-h-[220px] animate-pulse bg-[#f3f3f3]" />
        <StudentSurfaceCard className="min-h-[320px] animate-pulse bg-[#f3f3f3]" />
      </div>
    );
  }

  return (
    <StudentPageSection>
      <StudentSurfaceCard className="p-6 sm:p-8" tone="strong">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StudentPill>Sessão</StudentPill>
              <StudentPill accent>{format(today, "EEEE, dd MMM", { locale: ptBR })}</StudentPill>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl text-black sm:text-5xl">
                {featuredWorkout
                  ? `Hora de treinar, ${profileName || "atleta"}.`
                  : `Semana aberta, ${profileName || "atleta"}.`}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-black/58 sm:text-base">
                Esta rota agora é o ponto de entrada operacional do atleta. Ela abre a sessão certa, mostra pendências e mantém o foco no que precisa ser executado hoje.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {featuredWorkout ? (
                <Button asChild variant="primary-pill" className="h-12 px-6">
                  <Link to={`/dashboard/treino/${featuredWorkout.id}`}>Abrir sessão principal</Link>
                </Button>
              ) : (
                <Button asChild variant="secondary-pill" className="h-12 px-6">
                  <Link to="/dashboard/treinadores">Encontrar treinador</Link>
                </Button>
              )}
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/evolucao">Ver evolução</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Próxima sessão</p>
              <p className="mt-3 font-display text-2xl text-black">{featuredWorkout?.title ?? "Sem treino"}</p>
              <p className="mt-2 text-sm text-black/54">
                {featuredWorkout
                  ? `${featuredWorkout.workout_exercises.length} exercícios planejados`
                  : "Aguardando publicação do coach"}
              </p>
            </div>
            <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Aderência semanal</p>
              <p className="mt-3 font-display text-4xl text-black">{adherence}%</p>
              <p className="mt-2 text-sm text-black/54">
                {completedCount}/{weekWorkouts.length} concluídos
              </p>
            </div>
            <div className="rounded-[1.75rem] bg-[#f3f3f3] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">Comunidade</p>
              <p className="mt-3 font-display text-2xl text-black">{primaryGroup?.name ?? "Sem grupo"}</p>
              <p className="mt-2 text-sm text-black/54">
                {groups.length} grupo{groups.length === 1 ? "" : "s"} conectado{groups.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </StudentSurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <StudentSurfaceCard className="p-6 sm:p-8">
          <div className="flex flex-col gap-5">
            <StudentSectionHeading
              eyebrow="Fila operacional"
              title="Sessões da semana"
              action={
                <StudentPill className="text-sm tracking-[0.18em] text-black/62">
                  {pendingWorkouts.length} pendente{pendingWorkouts.length === 1 ? "" : "s"}
                </StudentPill>
              }
            />

            {weekWorkouts.length === 0 ? (
              <div className="rounded-[1.9rem] border border-dashed border-black/10 bg-[#f8f8f8] p-6 text-center">
                <p className="font-display text-2xl text-black">Nenhuma sessão nesta semana</p>
                <p className="mt-2 text-sm leading-relaxed text-black/54">
                  Quando um protocolo for publicado, esta tela vira seu ponto principal de entrada para treinar.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {weekWorkouts.map((workout) => {
                  const isDone = completedWorkoutIds.has(workout.id);
                  const isToday = isSameDay(new Date(`${workout.date}T12:00:00`), today);
                  const isFeatured = workout.id === featuredWorkout?.id;

                  return (
                    <Link
                      key={workout.id}
                      to={`/dashboard/treino/${workout.id}`}
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-[1.45rem] border px-4 py-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        isFeatured
                          ? "border-black bg-black text-white"
                          : isDone
                            ? "border-black/8 bg-[#f3f3f3] text-black/55"
                            : "border-black/8 bg-white text-black hover:bg-[#f8f8f8]",
                      )}
                    >
                      <div className="min-w-0">
                        <div className={cn(
                          "flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em]",
                          isFeatured ? "text-white/60" : "text-black/40",
                        )}>
                          <span>{format(new Date(`${workout.date}T12:00:00`), "EEE", { locale: ptBR })}</span>
                          {isToday ? <span className={isFeatured ? "text-white/70" : "text-black/58"}>Hoje</span> : null}
                          {isDone ? <span>Concluído</span> : null}
                        </div>
                        <p className={cn("mt-1 truncate text-base font-semibold", isDone && "line-through")}>{workout.title}</p>
                        <p className={cn("mt-1 text-sm", isFeatured ? "text-white/65" : "text-black/45")}>
                          {workout.workout_exercises.length} exercícios
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {isDone ? (
                          <span className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl border",
                            isFeatured ? "border-white/10 bg-white text-black" : "border-black bg-black text-white",
                          )}>
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8",
                            isFeatured ? "bg-white text-black" : "bg-[#efefef] text-black/55",
                          )}>
                            <ChevronRight className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </StudentSurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <StudentStatCard
            eyebrow="Hoje"
            value={weekWorkouts.filter((workout) => workout.date === todayIso).length}
            label="sessões programadas para o dia"
            icon={CalendarDays}
          />
          <StudentStatCard eyebrow="Execução" value={pendingWorkouts.length} label="blocos ainda abertos" icon={PlayCircle} accent />
          <StudentStatCard eyebrow="Consistência" value={completedCount} label="sessões fechadas na semana" icon={Flame} />
          <StudentStatCard eyebrow="Coach" value={groups.length} label="ambientes de treino ativos" icon={Users} />
        </div>
      </div>

      <StudentSurfaceCard className="p-6 sm:p-8">
        <StudentSectionHeading
          eyebrow="Próximo passo"
          title="Treinar, revisar e evoluir agora vivem em rotas separadas."
          description={
            <>
              Use <span className="text-black">Sessão</span> para abrir o treino certo,{" "}
              <span className="text-black">Evolução</span> para analytics e{" "}
              <span className="text-black">Histórico</span> para revisar sessões concluídas sem reentrar no modo operacional.
            </>
          }
          action={
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary-pill" className="h-12 px-6">
                <Link to="/dashboard/historico">Abrir histórico</Link>
              </Button>
              <Button asChild variant="primary-pill" className="h-12 px-6">
                <Link to="/dashboard/evolucao">Ver analytics</Link>
              </Button>
            </div>
          }
        />
      </StudentSurfaceCard>
    </StudentPageSection>
  );
};

export default ClientSessionHub;
