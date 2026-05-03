import { supabase } from "@/integrations/supabase/client";

export type WLog = { id: string; student_id: string; workout_id: string; completed_at: string };

export type ExerciseLogRow = {
  workout_log_id: string;
  exercise_id: string;
  set_number: number;
  is_completed: boolean | null;
  load_used: number | null;
  reps_done: number | null;
};

export function setDone(row: ExerciseLogRow | undefined): boolean {
  if (!row) return false;
  if (row.is_completed === true) return true;
  return row.load_used != null && row.reps_done != null;
}

export function metconScoresFilled(
  metconIds: string[],
  studentId: string,
  scoreMap: Map<string, string>,
): boolean {
  for (const mid of metconIds) {
    const v = scoreMap.get(`${studentId}::${mid}`);
    if (!v || !String(v).trim()) return false;
  }
  return true;
}

/** Sessão sem workout_exercises (ex.: smart): valida séries salvas por exercício */
export function smartExerciseBlocksComplete(logs: ExerciseLogRow[]): boolean {
  if (logs.length === 0) return false;
  const byEx = new Map<string, ExerciseLogRow[]>();
  for (const el of logs) {
    const arr = byEx.get(el.exercise_id) ?? [];
    arr.push(el);
    byEx.set(el.exercise_id, arr);
  }
  for (const [, rows] of byEx) {
    const maxSet = Math.max(...rows.map((r) => r.set_number), 0);
    if (maxSet < 1) return false;
    for (let sn = 1; sn <= maxSet; sn++) {
      const row = rows.find((r) => r.set_number === sn);
      if (!setDone(row)) return false;
    }
  }
  return true;
}

export function sessionCountsForRanking(
  wLogs: WLog[],
  workoutExercisesByWorkout: Map<string, { exercise_id: string; sets: number }[]>,
  metconsByWorkout: Map<string, string[]>,
  exerciseLogsByLogId: Map<string, ExerciseLogRow[]>,
  metconScores: Map<string, string>,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const log of wLogs) {
    const exercises = workoutExercisesByWorkout.get(log.workout_id) ?? [];
    const metconIds = metconsByWorkout.get(log.workout_id) ?? [];
    const elogs = exerciseLogsByLogId.get(log.id) ?? [];

    let ok = false;

    if (exercises.length > 0) {
      let blocksOk = true;
      for (const ex of exercises) {
        const n = Math.max(1, ex.sets || 1);
        for (let sn = 1; sn <= n; sn++) {
          const row = elogs.find((e) => e.exercise_id === ex.exercise_id && e.set_number === sn);
          if (!setDone(row)) {
            blocksOk = false;
            break;
          }
        }
        if (!blocksOk) break;
      }
      if (!blocksOk) {
        ok = false;
      } else {
        ok = metconScoresFilled(metconIds, log.student_id, metconScores);
      }
    } else if (metconIds.length > 0) {
      ok = smartExerciseBlocksComplete(elogs) && metconScoresFilled(metconIds, log.student_id, metconScores);
    } else {
      ok = smartExerciseBlocksComplete(elogs);
    }

    if (ok) {
      counts.set(log.student_id, (counts.get(log.student_id) ?? 0) + 1);
    }
  }

  return counts;
}

export async function fetchInChunks<T>(
  table: string,
  column: string,
  ids: string[],
  select: string,
): Promise<T[]> {
  const chunk = 400;
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    if (slice.length === 0) continue;
    const { data, error } = await supabase.from(table).select(select).in(column, slice);
    if (error) throw error;
    if (data) out.push(...(data as T[]));
  }
  return out;
}
