import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Layers, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from "date-fns";
import { TrainerWorkoutCalendarPanel } from "@/components/trainer/TrainerWorkoutCalendarPanel";
import { useTrainerWeekWorkouts } from "@/hooks/useTrainerWeekWorkouts";
import { useTrainerScopedWorkoutMeta, type ScopedMode } from "@/hooks/useTrainerScopedWorkoutMeta";
import { deleteTrainerWorkout } from "@/lib/trainer-workout-actions";
import { TrainerCopyWorkoutDialog } from "@/components/trainer/TrainerCopyWorkoutDialog";
import type { TrainerWeekWorkout } from "@/hooks/useTrainerWeekWorkouts";
import { StudentPeriodizationStrip } from "@/components/client/StudentPeriodizationStrip";

const TrainerScopedWorkouts = ({ mode }: { mode: ScopedMode }) => {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [copyWorkoutSource, setCopyWorkoutSource] = useState<TrainerWeekWorkout | null>(null);

  const {
    id,
    scope,
    fixedScope,
    plannerReturnPath,
    trainerId,
    students,
    groups,
    loadingMeta,
    scopeValid,
    entityName,
  } = useTrainerScopedWorkoutMeta(mode);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const workoutsEnabled = scopeValid && scope.kind !== "all";

  const { workouts, completedWorkoutIds, loading, refetch } = useTrainerWeekWorkouts(
    trainerId,
    currentWeekStart,
    currentWeekEnd,
    scope,
    workoutsEnabled,
  );

  const createWorkoutPath =
    mode === "student" && id
      ? `/trainer/atletas/${id}/treinos/criar?date=${encodeURIComponent(format(selectedDate, "yyyy-MM-dd"))}`
      : mode === "group" && id
        ? `/trainer/grupos/${id}/treinos/criar?date=${encodeURIComponent(format(selectedDate, "yyyy-MM-dd"))}`
        : "/trainer/treinos";

  const onDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteTrainerWorkout(workoutId);
      toast.success("Treino removido");
      refetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir";
      toast.error(msg);
    }
  };

  const listLoading = loading || loadingMeta;
  const showCalendar = scopeValid && fixedScope;

  const cycleEyebrow = mode === "student" ? "Calendário do atleta" : "Calendário do grupo";

  return (
    <div className="space-y-8 pb-12 pt-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate(mode === "student" ? "/trainer/atletas" : "/trainer/grupos")}
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-foreground/60 transition-colors hover:border-primary/20 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">Voltar</span>
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
              {mode === "student" ? <Users className="h-6 w-6 text-primary" /> : <Layers className="h-6 w-6 text-primary" />}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">{cycleEyebrow}</p>
              <h1 className="font-display text-3xl font-normal tracking-[-0.05em] text-foreground md:text-[2.4rem]">
                {entityName || "…"}
              </h1>
              <p className="font-body text-sm text-muted-foreground">
                {mode === "student"
                  ? "Planeie e acompanhe os treinos deste atleta."
                  : "Planeie e acompanhe os treinos deste grupo."}
              </p>
            </div>
          </div>
        </div>

        {showCalendar && fixedScope ? (
          <button
            type="button"
            onClick={() => navigate(createWorkoutPath)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-mono text-[10px] uppercase leading-tight tracking-[0.16em] text-primary-foreground transition-colors hover:opacity-90 sm:w-auto sm:px-8"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="flex flex-col items-center leading-none sm:items-end">
              <span>Novo</span>
              <span>treino</span>
            </span>
          </button>
        ) : (
          <div className="h-12 w-full animate-pulse rounded-lg border border-border bg-background sm:w-48" />
        )}
      </div>

      {showCalendar && id && (mode === "student" || mode === "group") ? (
        <StudentPeriodizationStrip
          studentId={mode === "student" ? id : undefined}
          groupId={mode === "group" ? id : undefined}
          trainerEditorId={trainerId}
          editable
        />
      ) : null}

      <TrainerCopyWorkoutDialog
        open={copyWorkoutSource !== null}
        onOpenChange={(o) => {
          if (!o) setCopyWorkoutSource(null);
        }}
        sourceWorkout={copyWorkoutSource}
        trainerId={trainerId}
        students={students}
        groups={groups}
        onSuccess={() => void refetch()}
      />

      <div className="border-t border-border pt-8">
        {showCalendar ? (
          <TrainerWorkoutCalendarPanel
            weekStart={currentWeekStart}
            weekEnd={currentWeekEnd}
            weekDays={weekDays}
            setWeekOffset={setWeekOffset}
            workouts={workouts}
            completedWorkoutIds={completedWorkoutIds}
            loading={listLoading}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            plannerReturnPath={plannerReturnPath}
            onOpenCopyWorkout={(w) => setCopyWorkoutSource(w)}
            onDeleteWorkout={onDeleteWorkout}
            cycleLabel={mode === "student" ? "Treino semanal" : "Treino do grupo"}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-8 py-24 text-foreground/30">
            <Dumbbell className="h-12 w-12 animate-pulse text-foreground/20" />
            <p className="font-mono text-[10px] uppercase tracking-widest">A carregar…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerScopedWorkouts;
