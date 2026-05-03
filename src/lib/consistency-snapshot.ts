import { supabase } from "@/integrations/supabase/client";
import { sessionCountsForRanking, type WLog } from "@/lib/ranking-session-validation";
import { buildValidationContextFromWLogs, computeGroupRanking } from "@/lib/group-ranking";

export type ConsistencySnapshot = {
  sessionsPrev30: number;
  sessionsLast30: number;
  groupName: string | null;
  groupPosition: number | null;
  groupPoints: number | null;
  strengthMetricLabel: string;
  strengthBefore: string;
  strengthAfter: string;
  hasStrengthData: boolean;
};

/** Conta sessões válidas (mesma regra do ranking) num intervalo de datas. */
export async function countValidSessionsForStudent(
  studentId: string,
  from: Date,
  to: Date,
  toExclusive = false,
): Promise<number> {
  let q = supabase
    .from("workout_logs")
    .select("id, student_id, workout_id, completed_at")
    .eq("student_id", studentId)
    .gte("completed_at", from.toISOString());
  q = toExclusive ? q.lt("completed_at", to.toISOString()) : q.lte("completed_at", to.toISOString());

  const { data: wLogsRaw, error } = await q;
  if (error) throw error;
  const wLogs = (wLogsRaw || []) as WLog[];
  const ctx = await buildValidationContextFromWLogs(wLogs);
  const counts = sessionCountsForRanking(
    wLogs,
    ctx.workoutExercisesByWorkout,
    ctx.metconsByWorkout,
    ctx.exerciseLogsByLogId,
    ctx.metconScores,
  );
  return counts.get(studentId) ?? 0;
}

async function getStrengthProgress(studentId: string): Promise<{
  label: string;
  before: string;
  after: string;
  hasStrengthData: boolean;
}> {
  const { data: best, error } = await supabase
    .from("student_max_loads")
    .select("exercise_id, max_load, unit")
    .eq("student_id", studentId)
    .gt("max_load", 0)
    .order("max_load", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !best) {
    return {
      label: "Maior carga",
      before: "—",
      after: "—",
      hasStrengthData: false,
    };
  }

  const { data: ex } = await supabase.from("exercises").select("name").eq("id", best.exercise_id).maybeSingle();
  const label = ex?.name ? `Carga (${ex.name})` : "Maior carga";
  const unit = best.unit || "kg";
  const after = `${Math.round(Number(best.max_load))} ${unit}`;

  const { data: wl } = await supabase
    .from("workout_logs")
    .select("id, completed_at")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: true });

  const logIds = wl?.map((w) => w.id) ?? [];
  if (logIds.length === 0) {
    return { label, before: "—", after, hasStrengthData: true };
  }

  const { data: elogs } = await supabase
    .from("exercise_logs")
    .select("load_used, workout_log_id")
    .eq("exercise_id", best.exercise_id)
    .in("workout_log_id", logIds)
    .gt("load_used", 0);

  const completedByLog = new Map((wl || []).map((w) => [w.id, w.completed_at]));
  const withDates = (elogs || [])
    .map((e) => ({
      load: Number(e.load_used),
      at: completedByLog.get(e.workout_log_id),
    }))
    .filter((x) => x.at && x.load > 0)
    .sort((a, b) => new Date(a.at!).getTime() - new Date(b.at!).getTime());

  if (withDates.length === 0) {
    return { label, before: "—", after, hasStrengthData: true };
  }

  const firstLoad = withDates[0]!.load;
  const before = `${Math.round(firstLoad)} ${unit}`;

  return {
    label,
    before,
    after,
    hasStrengthData: true,
  };
}

/**
 * Métricas reais para o card «Histórias de consistência».
 * Janelas: 30 dias anteriores vs últimos 30 dias; grupo = primeiro grupo do aluno.
 */
export async function fetchConsistencySnapshot(
  studentId: string,
  primaryGroup: { id: string; name: string } | null,
): Promise<ConsistencySnapshot> {
  const now = new Date();
  const last30Start = new Date(now);
  last30Start.setDate(last30Start.getDate() - 30);
  const prev30Start = new Date(now);
  prev30Start.setDate(prev30Start.getDate() - 60);

  const [sessionsLast30, sessionsPrev30, strength, ranking] = await Promise.all([
    countValidSessionsForStudent(studentId, last30Start, now, false),
    countValidSessionsForStudent(studentId, prev30Start, last30Start, true),
    getStrengthProgress(studentId),
    primaryGroup
      ? computeGroupRanking(primaryGroup.id).then((r) => {
          const idx = r.findIndex((x) => x.student_id === studentId);
          if (idx < 0) return null;
          return { position: idx + 1, points: r[idx]!.score };
        })
      : Promise.resolve(null),
  ]);

  return {
    sessionsPrev30,
    sessionsLast30,
    groupName: primaryGroup?.name ?? null,
    groupPosition: ranking?.position ?? null,
    groupPoints: ranking?.points ?? null,
    strengthMetricLabel: strength.label,
    strengthBefore: strength.before,
    strengthAfter: strength.after,
    hasStrengthData: strength.hasStrengthData,
  };
}
