import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";

import { StudentPageSection, StudentPill, StudentSurfaceCard } from "@/components/client/StudentPagePrimitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchStudentWorkoutsInRange, type StudentWorkoutRow } from "@/lib/student-workouts";
import { cn } from "@/lib/utils";

type CalendarMode = "week" | "month";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const normalizeDate = (value: string) => startOfDay(new Date(`${value}T12:00:00`));

const ClientTrainingCalendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<CalendarMode>("week");
  const [cursorDate, setCursorDate] = useState(startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [weekWorkouts, setWeekWorkouts] = useState<StudentWorkoutRow[]>([]);
  const [monthWorkouts, setMonthWorkouts] = useState<StudentWorkoutRow[]>([]);

  const weekStart = useMemo(() => startOfWeek(cursorDate, { weekStartsOn: 1 }), [cursorDate]);
  const weekEnd = useMemo(() => endOfWeek(cursorDate, { weekStartsOn: 1 }), [cursorDate]);
  const monthStart = useMemo(() => startOfMonth(cursorDate), [cursorDate]);
  const monthEnd = useMemo(() => endOfMonth(cursorDate), [cursorDate]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (!student?.id) {
        setWeekWorkouts([]);
        setMonthWorkouts([]);
        setLoading(false);
        return;
      }

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("student_id", student.id);

      const groupIds = memberships?.map((membership) => membership.group_id) ?? [];

      const [weekRows, monthRows] = await Promise.all([
        fetchStudentWorkoutsInRange(
          supabase,
          student.id,
          groupIds,
          format(weekStart, "yyyy-MM-dd"),
          format(weekEnd, "yyyy-MM-dd"),
        ),
        fetchStudentWorkoutsInRange(
          supabase,
          student.id,
          groupIds,
          format(monthStart, "yyyy-MM-dd"),
          format(monthEnd, "yyyy-MM-dd"),
        ),
      ]);

      setWeekWorkouts(weekRows);
      setMonthWorkouts(monthRows);
      setLoading(false);
    };

    void load();
  }, [monthEnd, monthStart, user, weekEnd, weekStart]);

  const workoutByDate = useMemo(() => {
    const map = new Map<string, StudentWorkoutRow[]>();
    for (const workout of monthWorkouts) {
      const current = map.get(workout.date) ?? [];
      map.set(workout.date, [...current, workout]);
    }
    return map;
  }, [monthWorkouts]);

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekEnd, weekStart],
  );

  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [monthEnd, monthStart]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedWorkouts = workoutByDate.get(selectedKey) ?? [];

  const moveCursor = (direction: "prev" | "next") => {
    const delta = direction === "next" ? 1 : -1;
    if (mode === "week") {
      const next = new Date(cursorDate);
      next.setDate(next.getDate() + 7 * delta);
      setCursorDate(startOfDay(next));
      return;
    }

    const next = new Date(cursorDate);
    next.setMonth(next.getMonth() + delta);
    setCursorDate(startOfDay(next));
  };

  const today = startOfDay(new Date());

  if (loading) {
    return (
      <StudentPageSection>
        <StudentSurfaceCard className="min-h-[380px] animate-pulse bg-[#f2f2f0]" />
      </StudentPageSection>
    );
  }

  return (
    <StudentPageSection>
      <StudentSurfaceCard className="p-5 sm:p-7" tone="strong">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <StudentPill>FitBlock Training</StudentPill>
              <h1 className="mt-3 font-display text-3xl text-black sm:text-4xl">Treinos da semana</h1>
              <p className="mt-2 text-sm text-black/58">Selecione um dia para abrir o treino disponível.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#ecece9] p-1.5">
              <button
                type="button"
                onClick={() => setMode("week")}
                className={cn(
                  "h-11 min-w-[90px] rounded-full px-4 text-sm font-semibold",
                  mode === "week" ? "bg-black text-white" : "text-black/58",
                )}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setMode("month")}
                className={cn(
                  "h-11 min-w-[90px] rounded-full px-4 text-sm font-semibold",
                  mode === "month" ? "bg-black text-white" : "text-black/58",
                )}
              >
                Mês
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#f3f3f1] p-3">
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => moveCursor("prev")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="font-display text-xl text-black">
              {mode === "week"
                ? `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM", { locale: ptBR })}`
                : format(cursorDate, "MMMM yyyy", { locale: ptBR })}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => moveCursor("next")}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {mode === "week" ? (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, index) => {
                const key = format(date, "yyyy-MM-dd");
                const hasWorkout = (workoutByDate.get(key) ?? []).length > 0;
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex min-h-[92px] flex-col items-center justify-center rounded-2xl border px-1 transition-all",
                      isSelected ? "border-black bg-black text-white" : "border-black/8 bg-white text-black",
                    )}
                  >
                    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", isSelected ? "text-white/62" : "text-black/45")}>
                      {DAY_LABELS[index]}
                    </span>
                    <span className="mt-1 font-display text-2xl">{format(date, "d")}</span>
                    <span
                      className={cn(
                        "mt-2 h-2 w-2 rounded-full",
                        hasWorkout ? (isSelected ? "bg-white" : "bg-black") : "bg-black/15",
                      )}
                    />
                    {isToday ? (
                      <span className={cn("mt-1 text-[10px]", isSelected ? "text-white/70" : "text-black/52")}>Hoje</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 px-1">
                {DAY_LABELS.map((day) => (
                  <p key={day} className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
                    {day}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((date) => {
                  const key = format(date, "yyyy-MM-dd");
                  const hasWorkout = (workoutByDate.get(key) ?? []).length > 0;
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, today);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex min-h-[62px] flex-col items-center justify-center rounded-xl border text-sm",
                        isSelected ? "border-black bg-black text-white" : "border-black/8 bg-white",
                        !isSameMonth(date, cursorDate) && "opacity-35",
                      )}
                    >
                      <span className="font-medium">{format(date, "d")}</span>
                      <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", hasWorkout ? (isSelected ? "bg-white" : "bg-black") : "bg-transparent")} />
                      {isToday ? <span className={cn("text-[9px]", isSelected ? "text-white/70" : "text-black/55")}>Hoje</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard className="p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/45">Dia selecionado</p>
            <h2 className="font-display text-2xl text-black">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {selectedWorkouts.length > 0 ? (
            selectedWorkouts.map((workout) => (
              <Link
                key={workout.id}
                to={`/dashboard/treino/${workout.id}`}
                className="flex min-h-[74px] items-center justify-between rounded-2xl border border-black/8 bg-[#f7f7f5] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-black">{workout.title}</p>
                  <p className="mt-1 text-sm text-black/55">{workout.workout_exercises.length} exercícios</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <Dumbbell className="h-4 w-4" />
                </span>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#fbfbfa] p-6 text-center">
              <p className="font-semibold text-black">Nenhum treino disponível nesse dia.</p>
              <p className="mt-2 text-sm text-black/55">Escolha outro dia da semana ou veja o mês para encontrar os treinos disponíveis.</p>
            </div>
          )}
        </div>
      </StudentSurfaceCard>
    </StudentPageSection>
  );
};

export default ClientTrainingCalendar;
