import { supabase } from "@/integrations/supabase/client";
import {
  fetchInChunks,
  sessionCountsForRanking,
  type ExerciseLogRow,
  type WLog,
} from "@/lib/ranking-session-validation";

export interface RankedMember {
  student_id: string;
  name: string;
  avatar_url?: string | null;
  workouts_count: number;
  total_volume: number;
  score: number;
}

/** Mapas para validar sessões (mesma regra que o ranking). */
export async function buildValidationContextFromWLogs(wLogs: WLog[]): Promise<{
  workoutExercisesByWorkout: Map<string, { exercise_id: string; sets: number }[]>;
  metconsByWorkout: Map<string, string[]>;
  exerciseLogsByLogId: Map<string, ExerciseLogRow[]>;
  metconScores: Map<string, string>;
}> {
  const empty = {
    workoutExercisesByWorkout: new Map<string, { exercise_id: string; sets: number }[]>(),
    metconsByWorkout: new Map<string, string[]>(),
    exerciseLogsByLogId: new Map<string, ExerciseLogRow[]>(),
    metconScores: new Map<string, string>(),
  };
  if (wLogs.length === 0) return empty;

  const logIds = wLogs.map((l) => l.id);
  const workoutIds = [...new Set(wLogs.map((l) => l.workout_id))];
  const studentIds = [...new Set(wLogs.map((l) => l.student_id))];

  const workoutExercisesByWorkout = new Map<string, { exercise_id: string; sets: number }[]>();
  const metconsByWorkout = new Map<string, string[]>();

  if (workoutIds.length > 0) {
    const wex = await fetchInChunks<{ workout_id: string; exercise_id: string; sets: number }>(
      "workout_exercises",
      "workout_id",
      workoutIds,
      "workout_id, exercise_id, sets",
    );
    for (const row of wex) {
      const arr = workoutExercisesByWorkout.get(row.workout_id) ?? [];
      arr.push({ exercise_id: row.exercise_id, sets: row.sets });
      workoutExercisesByWorkout.set(row.workout_id, arr);
    }

    const wm = await fetchInChunks<{ workout_id: string; id: string }>(
      "workout_metcons",
      "workout_id",
      workoutIds,
      "workout_id, id",
    );
    for (const row of wm) {
      const arr = metconsByWorkout.get(row.workout_id) ?? [];
      arr.push(row.id);
      metconsByWorkout.set(row.workout_id, arr);
    }
  }

  const exerciseLogsByLogId = new Map<string, ExerciseLogRow[]>();
  if (logIds.length > 0) {
    const eLogs = await fetchInChunks<ExerciseLogRow>(
      "exercise_logs",
      "workout_log_id",
      logIds,
      "workout_log_id, exercise_id, set_number, is_completed, load_used, reps_done",
    );
    for (const row of eLogs) {
      const arr = exerciseLogsByLogId.get(row.workout_log_id) ?? [];
      arr.push(row);
      exerciseLogsByLogId.set(row.workout_log_id, arr);
    }
  }

  const allMetconIds = [...new Set([...metconsByWorkout.values()].flat())];
  const metconScores = new Map<string, string>();
  if (allMetconIds.length > 0 && studentIds.length > 0) {
    const { data: scores } = await supabase
      .from("metcon_scores")
      .select("student_id, metcon_id, score_value")
      .in("student_id", studentIds)
      .in("metcon_id", allMetconIds);
    for (const s of scores || []) {
      metconScores.set(`${s.student_id}::${s.metcon_id}`, s.score_value);
    }
  }

  return { workoutExercisesByWorkout, metconsByWorkout, exerciseLogsByLogId, metconScores };
}

/** Treinos finalizados no app (sessões válidas), últimos 30 dias, ordenados por pontos. */
export async function computeGroupRanking(groupId: string): Promise<RankedMember[]> {
  const { data: members } = await supabase.from("group_members").select("student_id").eq("group_id", groupId);
  if (!members || members.length === 0) return [];

  const studentIds = members.map((m) => m.student_id);

  const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
  const userIds = students?.map((s) => s.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, avatar_url")
    .in("user_id", userIds);
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
  const studentUserMap = new Map(students?.map((s) => [s.id, s.user_id]) || []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: wLogsRaw } = await supabase
    .from("workout_logs")
    .select("id, student_id, workout_id, completed_at")
    .in("student_id", studentIds)
    .gte("completed_at", thirtyDaysAgo.toISOString());

  const wLogs = (wLogsRaw || []) as WLog[];
  const { workoutExercisesByWorkout, metconsByWorkout, exerciseLogsByLogId, metconScores } =
    await buildValidationContextFromWLogs(wLogs);

  const sessionCounts = sessionCountsForRanking(
    wLogs,
    workoutExercisesByWorkout,
    metconsByWorkout,
    exerciseLogsByLogId,
    metconScores,
  );

  const ranked: RankedMember[] = studentIds.map((sid) => {
    const userId = studentUserMap.get(sid) || "";
    const profile = profileMap.get(userId);
    const completed = sessionCounts.get(sid) ?? 0;
    return {
      student_id: sid,
      name: profile?.name || "Sem nome",
      avatar_url: profile?.avatar_url || null,
      workouts_count: completed,
      total_volume: 0,
      score: completed,
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
