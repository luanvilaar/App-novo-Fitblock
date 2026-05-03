import type { Dispatch, SetStateAction } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  Layers,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import type { TrainerWeekWorkout } from "@/hooks/useTrainerWeekWorkouts";
import type { TrainerWorkoutPlannerLocationState } from "@/lib/trainer-workout-nav";
import { TrainerPanelCard } from "@/components/trainer/TrainerPanelCard";
import { cn } from "@/lib/utils";

export function TrainerWorkoutCalendarPanel({
  weekStart,
  weekEnd,
  weekDays,
  setWeekOffset,
  workouts,
  completedWorkoutIds,
  loading,
  selectedDate,
  setSelectedDate,
  plannerReturnPath,
  onOpenCopyWorkout,
  onDeleteWorkout,
  cycleLabel = "Treino semanal",
}: {
  weekStart: Date;
  weekEnd: Date;
  weekDays: Date[];
  setWeekOffset: Dispatch<SetStateAction<number>>;
  workouts: TrainerWeekWorkout[];
  completedWorkoutIds: Set<string>;
  loading: boolean;
  selectedDate: Date;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  plannerReturnPath: string;
  onOpenCopyWorkout: (workout: TrainerWeekWorkout) => void;
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  cycleLabel?: string;
}) {
  const navigate = useNavigate();

  const getWorkoutsForDay = (day: Date) => workouts.filter((w) => isSameDay(new Date(w.date + "T12:00:00"), day));

  const goToWorkout = (workoutId: string) => {
    const state: TrainerWorkoutPlannerLocationState = { fromTrainerPlanner: plannerReturnPath };
    navigate(`/trainer/treinos/${workoutId}`, { state });
  };

  const weekRangeTitle = `${format(weekStart, "dd MMM", { locale: ptBR })} — ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="space-y-8">
      <TrainerPanelCard
        compact
        eyebrow={cycleLabel}
        title={weekRangeTitle}
        subtitle="Escolha um dia da semana para filtrar a lista em baixo."
      >
        <div className="mt-2 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <button
            type="button"
            onClick={() => setWeekOffset((p) => p - 1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Navegar semana</p>
          <button
            type="button"
            onClick={() => setWeekOffset((p) => p + 1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Semana seguinte"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2 sm:gap-3">
          {weekDays.map((day) => {
            const dayWorkouts = getWorkoutsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const allCompleted = dayWorkouts.length > 0 && dayWorkouts.every((w) => completedWorkoutIds.has(w.id));

            return (
              <div
                key={day.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDate(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDate(day);
                  }
                }}
                className={cn(
                  "relative flex h-[7.5rem] flex-col rounded-xl border p-2.5 transition-all duration-200 sm:h-32 sm:p-3",
                  isSelected
                    ? "border-energy/50 bg-[#161616] shadow-[0_0_0_1px_rgba(51,33,74,0.2)]"
                    : isToday
                      ? "border-dashed border-white/20 bg-white/[0.03]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "font-mono text-[8px] font-bold uppercase tracking-wider sm:text-[9px]",
                      isSelected ? "text-energy" : "text-white/35",
                    )}
                  >
                    {format(day, "EEE", { locale: ptBR }).replace(".", "")}
                  </span>
                  {allCompleted && (
                    <Check className={cn("h-3.5 w-3.5", isSelected ? "text-energy" : "text-energy/80")} strokeWidth={2.5} />
                  )}
                </div>

                <span
                  className={cn(
                    "font-display text-xl font-bold leading-none sm:text-2xl",
                    isSelected ? "text-white" : "text-white/85",
                  )}
                >
                  {format(day, "dd")}
                </span>

                <div className="mt-auto flex max-h-[2.5rem] flex-col gap-0.5 overflow-hidden">
                  {dayWorkouts.slice(0, 2).map((w) => {
                    const isCompleted = completedWorkoutIds.has(w.id);
                    return (
                      <div
                        key={w.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToWorkout(w.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            goToWorkout(w.id);
                          }
                        }}
                        className={cn(
                          "truncate rounded-md border px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-wide sm:text-[7px]",
                          isCompleted
                            ? "border-energy/25 bg-energy/10 text-energy"
                            : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white/70",
                        )}
                      >
                        {isCompleted && "✓ "}
                        {w.title}
                      </div>
                    );
                  })}
                  {dayWorkouts.length > 2 && (
                    <span className="font-mono text-[6px] uppercase tracking-widest text-white/25 sm:text-[7px]">
                      +{dayWorkouts.length - 2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </TrainerPanelCard>

      <TrainerPanelCard compact eyebrow="Treinos do dia" title={format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}>
        <div className="mt-2 grid grid-cols-1 gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-[#0a0a0a]" />
              ))}
            </>
          ) : getWorkoutsForDay(selectedDate).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#121212]">
                <Dumbbell className="h-7 w-7 text-white/25" />
              </div>
              <div className="space-y-1">
                <p className="font-body text-base font-medium text-white/80">Nenhum treino nesta data</p>
                <p className="font-body text-sm text-muted-foreground">Use &quot;Novo treino&quot; para agendar a primeira sessão.</p>
              </div>
            </div>
          ) : (
            getWorkoutsForDay(selectedDate).map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212] transition-colors hover:border-white/15"
                onClick={() => goToWorkout(w.id)}
              >
                <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h4 className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-white sm:text-xl">
                        {w.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-muted-foreground">
                        <span className="font-medium text-primary">{w.category}</span>
                        <span className="text-white/20">·</span>
                        <span>
                          {w.description?.includes("-") ? "Prescrição inteligente" : `${w.workout_exercises?.length ?? 0} exercícios`}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          {w.is_group ? <Layers className="h-3 w-3 text-energy" /> : <Users className="h-3 w-3 text-energy" />}
                          {w.is_group ? "Grupo" : "Individual"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => goToWorkout(w.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:border-white/20 hover:text-white"
                      title="Editar treino"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCopyWorkout(w)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:border-primary/35 hover:text-primary"
                      title="Copiar treino (outro atleta ou grupo)"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWorkout(w.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/35 transition-colors hover:border-destructive/50 hover:bg-destructive/15 hover:text-destructive"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </TrainerPanelCard>
    </div>
  );
}
