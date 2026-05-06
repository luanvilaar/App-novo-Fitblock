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

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TrainerWorkout {
  id: string;
  title: string;
  date: string;
  is_group: boolean | null;
  group_id: string | null;
  student_id: string | null;
}

type CalendarMode = "week" | "month";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const TrainerScheduleHub = () => {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<CalendarMode>("week");
  const [cursorDate, setCursorDate] = useState(startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [workouts, setWorkouts] = useState<TrainerWorkout[]>([]);
  const [groupNameById, setGroupNameById] = useState<Map<string, string>>(new Map());
  const [studentNameById, setStudentNameById] = useState<Map<string, string>>(new Map());

  const weekStart = useMemo(() => startOfWeek(cursorDate, { weekStartsOn: 1 }), [cursorDate]);
  const weekEnd = useMemo(() => endOfWeek(cursorDate, { weekStartsOn: 1 }), [cursorDate]);
  const monthStart = useMemo(() => startOfMonth(cursorDate), [cursorDate]);
  const monthEnd = useMemo(() => endOfMonth(cursorDate), [cursorDate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", userId).maybeSingle();
      if (!trainer?.id) {
        setLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from("workouts")
        .select("id, title, date, is_group, group_id, student_id")
        .eq("trainer_id", trainer.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      const safeRows = (rows ?? []) as TrainerWorkout[];
      setWorkouts(safeRows);

      const groupIds = [...new Set(safeRows.map((w) => w.group_id).filter(Boolean))] as string[];
      const studentIds = [...new Set(safeRows.map((w) => w.student_id).filter(Boolean))] as string[];

      if (groupIds.length > 0) {
        const { data: groups } = await supabase.from("groups").select("id, name").in("id", groupIds);
        setGroupNameById(new Map((groups ?? []).map((g) => [g.id, g.name])));
      } else {
        setGroupNameById(new Map());
      }

      if (studentIds.length > 0) {
        const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
        const userIds = (students ?? []).map((s) => s.user_id);
        const { data: profiles } = userIds.length > 0
          ? await supabase.from("profiles").select("user_id, name").in("user_id", userIds)
          : { data: [] as { user_id: string; name: string | null }[] };

        const nameByUser = new Map((profiles ?? []).map((p) => [p.user_id, p.name ?? "Atleta"]));
        setStudentNameById(
          new Map((students ?? []).map((s) => [s.id, nameByUser.get(s.user_id) ?? "Atleta"])),
        );
      } else {
        setStudentNameById(new Map());
      }

      setLoading(false);
    };

    void load();
  }, [monthEnd, monthStart]);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, TrainerWorkout[]>();
    for (const workout of workouts) {
      const existing = map.get(workout.date) ?? [];
      map.set(workout.date, [...existing, workout]);
    }
    return map;
  }, [workouts]);

  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekEnd, weekStart]);
  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [monthEnd, monthStart]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayWorkouts = workoutsByDate.get(selectedKey) ?? [];

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

  const subtitleForWorkout = (workout: TrainerWorkout) => {
    if (workout.is_group && workout.group_id) return `Grupo: ${groupNameById.get(workout.group_id) ?? "Grupo"}`;
    if (workout.student_id) return `Atleta: ${studentNameById.get(workout.student_id) ?? "Atleta"}`;
    return "Treino";
  };

  if (loading) {
    return <div className="min-h-[320px] animate-pulse rounded-[2rem] bg-[#f3f3f1]" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-black/6 bg-[#f7f7f5] p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">Coach agenda</p>
            <h1 className="mt-2 font-sans text-3xl font-black tracking-tight text-black sm:text-4xl">Calendário de treinos</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white p-1.5">
            <button type="button" onClick={() => setMode("week")} className={cn("h-11 min-w-[90px] rounded-full px-4 text-sm font-semibold", mode === "week" ? "bg-black text-white" : "text-black/60")}>Semana</button>
            <button type="button" onClick={() => setMode("month")} className={cn("h-11 min-w-[90px] rounded-full px-4 text-sm font-semibold", mode === "month" ? "bg-black text-white" : "text-black/60")}>Mês</button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white p-3">
          <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => moveCursor("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="font-sans text-lg font-bold text-black sm:text-xl">
            {mode === "week"
              ? `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM", { locale: ptBR })}`
              : format(cursorDate, "MMMM yyyy", { locale: ptBR })}
          </p>
          <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => moveCursor("next")}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {mode === "week" ? (
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekDays.map((date, index) => {
              const key = format(date, "yyyy-MM-dd");
              const hasWorkout = (workoutsByDate.get(key) ?? []).length > 0;
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);

              return (
                <button key={key} type="button" onClick={() => setSelectedDate(date)} className={cn("flex min-h-[90px] flex-col items-center justify-center rounded-2xl border px-1", isSelected ? "border-black bg-black text-white" : "border-black/8 bg-white text-black")}>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", isSelected ? "text-white/62" : "text-black/45")}>{DAY_LABELS[index]}</span>
                  <span className="mt-1 text-2xl font-black">{format(date, "d")}</span>
                  <span className={cn("mt-2 h-2 w-2 rounded-full", hasWorkout ? (isSelected ? "bg-white" : "bg-black") : "bg-black/15")} />
                  {isToday ? <span className={cn("mt-1 text-[10px]", isSelected ? "text-white/72" : "text-black/55")}>Hoje</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-7 gap-2 px-1">
              {DAY_LABELS.map((day) => (
                <p key={day} className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">{day}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((date) => {
                const key = format(date, "yyyy-MM-dd");
                const hasWorkout = (workoutsByDate.get(key) ?? []).length > 0;
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                return (
                  <button key={key} type="button" onClick={() => setSelectedDate(date)} className={cn("flex min-h-[62px] flex-col items-center justify-center rounded-xl border text-sm", isSelected ? "border-black bg-black text-white" : "border-black/8 bg-white", !isSameMonth(date, cursorDate) && "opacity-35")}>
                    <span className="font-semibold">{format(date, "d")}</span>
                    <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", hasWorkout ? (isSelected ? "bg-white" : "bg-black") : "bg-transparent")} />
                    {isToday ? <span className={cn("text-[9px]", isSelected ? "text-white/72" : "text-black/55")}>Hoje</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-black/6 bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/45">Treinos do dia</p>
            <h2 className="text-xl font-black text-black sm:text-2xl">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {selectedDayWorkouts.length > 0 ? (
            selectedDayWorkouts.map((workout) => (
              <Link key={workout.id} to={`/trainer/treinos/${workout.id}`} className="flex min-h-[74px] items-center justify-between rounded-2xl border border-black/8 bg-[#f7f7f5] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-black">{workout.title}</p>
                  <p className="mt-1 truncate text-sm text-black/55">{subtitleForWorkout(workout)}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <Dumbbell className="h-4 w-4" />
                </span>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#fbfbfa] p-6 text-center">
              <p className="font-semibold text-black">Nenhum treino agendado nesse dia.</p>
              <p className="mt-2 text-sm text-black/55">Navegue na semana ou no mês para visualizar os treinos planejados.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TrainerScheduleHub;
