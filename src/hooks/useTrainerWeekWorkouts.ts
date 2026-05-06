import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { WorkoutScope } from "@/lib/trainer-workout-scope";

export interface TrainerWeekWorkout {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string | null;
  is_group: boolean;
  workout_exercises: { id: string }[];
}

export function useTrainerWeekWorkouts(
  trainerId: string | null,
  weekStart: Date,
  weekEnd: Date,
  scope: WorkoutScope,
  enabled = true,
) {
  const [workouts, setWorkouts] = useState<TrainerWeekWorkout[]>([]);
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");
  const kind = scope.kind;
  const studentId = kind === "student" ? scope.studentId : undefined;
  const groupId = kind === "group" ? scope.groupId : undefined;

  const fetchWorkouts = useCallback(async () => {
    const isScoped = (kind === "student" && studentId) || (kind === "group" && groupId);
    if (!enabled || (!trainerId && !isScoped)) {
      setLoading(false);
      if (!enabled) {
        setWorkouts([]);
        setCompletedWorkoutIds(new Set());
      }
      return;
    }
    setLoading(true);

    let query = supabase
      .from("workouts")
      .select("id, title, category, date, description, is_group, workout_exercises(id)")
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: true });

    if (trainerId) {
      query = query.eq("trainer_id", trainerId);
    }

    if (kind === "student" && studentId) {
      query = query.eq("student_id", studentId).eq("is_group", false);
    } else if (kind === "group" && groupId) {
      query = query.eq("group_id", groupId).eq("is_group", true);
    }

    const { data } = await query;
    if (data) {
      setWorkouts(data as TrainerWeekWorkout[]);
      const workoutIds = data.map((w: { id: string }) => w.id);
      if (workoutIds.length > 0) {
        const { data: logs } = await supabase.from("workout_logs").select("workout_id").in("workout_id", workoutIds);
        if (logs) {
          setCompletedWorkoutIds(new Set(logs.map((l: { workout_id: string }) => l.workout_id)));
        }
      } else {
        setCompletedWorkoutIds(new Set());
      }
    }
    setLoading(false);
  }, [trainerId, startStr, endStr, kind, studentId, groupId, enabled]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return { workouts, completedWorkoutIds, loading, refetch: fetchWorkouts };
}

/** Escopo estável para páginas com params de rota */
export function useMemoWorkoutScopeStudent(studentId: string | undefined): WorkoutScope {
  return useMemo(
    () => (studentId ? { kind: "student" as const, studentId } : { kind: "all" as const }),
    [studentId],
  );
}

export function useMemoWorkoutScopeGroup(groupId: string | undefined): WorkoutScope {
  return useMemo(
    () => (groupId ? { kind: "group" as const, groupId } : { kind: "all" as const }),
    [groupId],
  );
}
