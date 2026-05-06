import type { Dispatch, SetStateAction } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Copy, Dumbbell, Layers, Trash2, Users } from "lucide-react";
import type { TrainerWeekWorkout } from "@/hooks/useTrainerWeekWorkouts";
import type { TrainerWorkoutPlannerLocationState } from "@/lib/trainer-workout-nav";
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

  const getWorkoutsForDay = (day: Date) => workouts.filter((w) => isSameDay(new Date(`${w.date}T12:00:00`), day));

  const goToWorkout = (workoutId: string) => {
    const state: TrainerWorkoutPlannerLocationState = { fromTrainerPlanner: plannerReturnPath };
    navigate(`/trainer/treinos/${workoutId}`, { state });
  };

  const weekRangeTitle = `${format(weekStart, "dd MMM", { locale: ptBR })} — ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`;
  const weekRangeCompact = `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`;

  const workoutsOfSelectedDay = getWorkoutsForDay(selectedDate);

  return (
    <div className="space-y-10">
      <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[2.5rem] border border-black/5 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-8 md:p-10">
          <header className="mb-6 space-y-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
              {cycleLabel.replace(/\s+/g, " · ").toUpperCase()}
            </p>
            <h3 className="break-words font-sans text-3xl font-bold tracking-tight text-black sm:text-4xl">
              {weekRangeTitle.toLowerCase()}
            </h3>
            <p className="break-words font-sans text-base font-medium text-black/40">
              Escolha um dia da semana para filtrar a lista em baixo.
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mt-2 flex items-center justify-between gap-4 border-b border-black/10 pb-6">
              <button
                type="button"
                onClick={() => setWeekOffset((previous) => previous - 1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition-all duration-200 hover:border-black/25 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/35">Navegar semana</p>
                <p className="mt-1 text-xs font-medium text-black/60">{weekRangeCompact.toLowerCase()}</p>
              </div>

              <button
                type="button"
                onClick={() => setWeekOffset((previous) => previous + 1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition-all duration-200 hover:border-black/25 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                aria-label="Semana seguinte"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto pt-3">
              <div className="grid min-w-[48rem] grid-cols-7 gap-2 sm:gap-3">
                {weekDays.map((day) => {
                  const dayWorkouts = getWorkoutsForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const hasWorkouts = dayWorkouts.length > 0;
                  const isCompleted = hasWorkouts && dayWorkouts.every((workout) => completedWorkoutIds.has(workout.id));
                  const dayLabel = format(day, "EEEE", { locale: ptBR }).replace("-feira", "");

                  return (
                    <motion.button
                      key={day.toISOString()}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.16 }}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative flex h-[7.6rem] min-w-0 flex-col rounded-2xl border p-2.5 text-left transition-all duration-200 sm:h-32 sm:p-3",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80",
                        isSelected && "border-black bg-black text-white shadow-[0_10px_26px_rgba(0,0,0,0.22)]",
                        !isSelected && isToday && "border-black/35 bg-white",
                        !isSelected && !isToday && hasWorkouts && "border-black/15 bg-white hover:border-black/30",
                        !isSelected && !isToday && !hasWorkouts && "border-black/10 bg-[#f5f5f5] text-black/80 hover:bg-white",
                      )}
                      aria-label={`${dayLabel}, ${format(day, "dd/MM")} com ${dayWorkouts.length} treino${dayWorkouts.length === 1 ? "" : "s"}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "font-mono text-[8px] font-bold uppercase tracking-wider sm:text-[9px]",
                            isSelected ? "text-white/70" : "text-black/45",
                          )}
                        >
                          {dayLabel}
                        </span>
                        {isToday ? (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.16em]",
                              isSelected ? "bg-white/15 text-white" : "bg-black text-white",
                            )}
                          >
                            Hoje
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={cn(
                          "font-display text-xl leading-none tracking-[-0.04em] sm:text-2xl",
                          isSelected ? "text-white" : "text-black/90",
                        )}
                      >
                        {format(day, "dd")}
                      </span>

                      <div className="mt-auto flex max-h-[2.5rem] flex-col gap-0.5 overflow-hidden">
                        {hasWorkouts ? (
                          <span
                            className={cn(
                              "inline-flex items-center justify-center gap-1 truncate rounded-full border px-2 py-1 font-mono text-[7px] uppercase tracking-[0.14em] sm:text-[8px]",
                              isSelected
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-black/15 bg-black text-white",
                            )}
                          >
                            {isCompleted ? <Check className="h-3 w-3" /> : null}
                            {dayWorkouts.length} {dayWorkouts.length === 1 ? "sessão" : "sessões"}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex justify-center truncate rounded-full border px-2 py-1 font-mono text-[7px] uppercase tracking-[0.14em] sm:text-[8px]",
                              isSelected ? "border-white/25 bg-white/5 text-white/75" : "border-black/10 bg-white text-black/35",
                            )}
                          >
                            Sem treino
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-4">
          <h4 className="font-sans text-2xl font-bold tracking-tight text-black">Treinos do dia</h4>
          <div className="h-px flex-1 bg-black/10" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="h-32 animate-pulse rounded-[2rem] bg-[#f3f3f3]" />
              ))}
            </>
          ) : workoutsOfSelectedDay.length === 0 ? (
            <div className="col-span-full rounded-[2rem] border border-black/5 bg-[#f5f5f5] px-6 py-16 text-center">
              <Dumbbell className="mx-auto mb-5 h-12 w-12 text-black/15" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                Nenhum treino agendado
              </p>
            </div>
          ) : (
            workoutsOfSelectedDay.map((workout, index) => (
              <motion.article
                key={workout.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                onClick={() => goToWorkout(workout.id)}
                className="group flex cursor-pointer flex-col justify-between rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition-all duration-200 hover:border-black/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.11)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="truncate font-sans text-2xl font-bold tracking-tight text-black">
                        {workout.title.toLowerCase()}
                      </h5>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em]",
                          completedWorkoutIds.has(workout.id) ? "bg-black text-white" : "bg-black/5 text-black/50",
                        )}
                      >
                        {workout.category}
                      </span>
                    </div>
                    <p className="text-sm text-black/45">
                      {workout.description?.includes("-")
                        ? "Protocolo inteligente"
                        : `${workout.workout_exercises?.length ?? 0} movimentos prescritos`}
                    </p>
                  </div>

                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-[#f5f5f5] text-black/45 transition-colors duration-200 group-hover:bg-black group-hover:text-white">
                    <Dumbbell className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/45">
                    {workout.is_group ? <Layers className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                    {workout.is_group ? "Grupo" : "Individual"}
                  </div>

                  <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenCopyWorkout(workout)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#f5f5f5] text-black/40 transition-all duration-200 hover:border-black hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      title="Copiar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWorkout(workout.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#f5f5f5] text-black/40 transition-all duration-200 hover:border-red-500 hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
