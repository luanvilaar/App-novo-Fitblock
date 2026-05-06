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
    <div className="space-y-16 pb-32 pt-8 px-safe">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => navigate(mode === "student" ? "/trainer/atletas" : "/trainer/grupos")}
              className="group h-12 flex items-center gap-2 rounded-full border border-black/5 bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black/40 transition-all hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
              Voltar
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-black text-white shadow-lg">
                {mode === "student" ? <Users className="h-8 w-8" /> : <Layers className="h-8 w-8" />}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">{cycleEyebrow}</p>
                <h1 className="font-sans text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-6xl">
                  {entityName?.toLowerCase() || "…"}
                </h1>
                <p className="font-sans text-sm font-medium text-black/40">
                  {mode === "student"
                    ? "Gestão e planejamento individual de protocolos."
                    : "Gestão e planejamento coletivo de protocolos."}
                </p>
              </div>
            </div>
          </div>

          {showCalendar && fixedScope ? (
            <button
              type="button"
              onClick={() => navigate(createWorkoutPath)}
              className="h-16 w-full sm:w-auto rounded-full bg-black px-10 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              Novo Treino
            </button>
          ) : (
            <div className="h-16 w-full sm:w-64 animate-pulse rounded-full bg-[#f3f3f3]" />
          )}
        </header>

        {showCalendar && id && (mode === "student" || mode === "group") ? (
          <div className="rounded-[2.5rem] border border-black/5 bg-white p-2 shadow-sm">
            <StudentPeriodizationStrip
              studentId={mode === "student" ? id : undefined}
              groupId={mode === "group" ? id : undefined}
              trainerEditorId={trainerId}
              editable
            />
          </div>
        ) : null}
      </div>

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

      <div className="border-t border-black/5 pt-16">
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
            cycleLabel={mode === "student" ? "Ciclo Semanal" : "Ciclo do Grupo"}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 rounded-[2.5rem] bg-[#f3f3f3] ring-1 ring-black/5">
            <Dumbbell className="h-20 w-20 animate-pulse text-black/10 mb-8" />
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black/20">Sincronizando agenda…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerScopedWorkouts;
