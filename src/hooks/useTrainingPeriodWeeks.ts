import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PeriodPhase } from "@/lib/training-periodization";

export type PeriodWeekScope =
  | { kind: "student"; studentId: string }
  | { kind: "group"; groupId: string };

export type TrainingPeriodWeekRow = {
  id: string;
  week_start: string;
  phase: PeriodPhase;
  notes: string | null;
  student_id?: string;
  group_id?: string;
};

/** Treinador: periodização por aluno ou por grupo. */
export function useScopedPeriodWeeks(scope: PeriodWeekScope | null, weekStarts: string[]) {
  const [rows, setRows] = useState<TrainingPeriodWeekRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    if (!scope || weekStarts.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const minD = weekStarts.reduce((a, b) => (a < b ? a : b));
    const maxD = weekStarts.reduce((a, b) => (a > b ? a : b));

    if (scope.kind === "student") {
      const { data, error } = await supabase
        .from("training_period_weeks")
        .select("id, student_id, week_start, phase, notes")
        .eq("student_id", scope.studentId)
        .gte("week_start", minD)
        .lte("week_start", maxD);
      if (!error && data) setRows(data as TrainingPeriodWeekRow[]);
      else setRows([]);
    } else {
      const { data, error } = await supabase
        .from("group_training_period_weeks")
        .select("id, group_id, week_start, phase, notes")
        .eq("group_id", scope.groupId)
        .gte("week_start", minD)
        .lte("week_start", maxD);
      if (!error && data) setRows(data as TrainingPeriodWeekRow[]);
      else setRows([]);
    }
    setLoading(false);
  }, [scope, weekStarts]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const upsertPhase = async (weekStart: string, phase: PeriodPhase) => {
    if (!scope) throw new Error("scope");
    if (scope.kind === "student") {
      const { error } = await supabase.from("training_period_weeks").upsert(
        { student_id: scope.studentId, week_start: weekStart, phase },
        { onConflict: "student_id,week_start" },
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from("group_training_period_weeks").upsert(
        { group_id: scope.groupId, week_start: weekStart, phase },
        { onConflict: "group_id,week_start" },
      );
      if (error) throw error;
    }
    await fetchRows();
  };

  const upsertManyPhases = async (weekStartsToWrite: string[], phase: PeriodPhase) => {
    if (!scope) throw new Error("scope");
    if (weekStartsToWrite.length === 0) return;

    const writes = weekStartsToWrite.map((weekStart) =>
      scope.kind === "student"
        ? supabase.from("training_period_weeks").upsert(
            { student_id: scope.studentId, week_start: weekStart, phase },
            { onConflict: "student_id,week_start" },
          )
        : supabase.from("group_training_period_weeks").upsert(
            { group_id: scope.groupId, week_start: weekStart, phase },
            { onConflict: "group_id,week_start" },
          ),
    );

    const results = await Promise.all(writes);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    await fetchRows();
  };

  const clearWeek = async (weekStart: string) => {
    if (!scope) throw new Error("scope");
    if (scope.kind === "student") {
      const { error } = await supabase
        .from("training_period_weeks")
        .delete()
        .eq("student_id", scope.studentId)
        .eq("week_start", weekStart);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("group_training_period_weeks")
        .delete()
        .eq("group_id", scope.groupId)
        .eq("week_start", weekStart);
      if (error) throw error;
    }
    await fetchRows();
  };

  const clearManyWeeks = async (weekStartsToClear: string[]) => {
    if (!scope) throw new Error("scope");
    if (weekStartsToClear.length === 0) return;

    if (scope.kind === "student") {
      const { error } = await supabase
        .from("training_period_weeks")
        .delete()
        .eq("student_id", scope.studentId)
        .in("week_start", weekStartsToClear);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("group_training_period_weeks")
        .delete()
        .eq("group_id", scope.groupId)
        .in("week_start", weekStartsToClear);
      if (error) throw error;
    }

    await fetchRows();
  };

  return { rows, loading, refetch: fetchRows, upsertPhase, upsertManyPhases, clearWeek, clearManyWeeks };
}

/** Aluno (dashboard): fases próprias + fases dos grupos a que pertence (prioridade ao aluno). */
export function useMergedPeriodWeeksForStudent(studentId: string | null, weekStarts: string[]) {
  const [rows, setRows] = useState<TrainingPeriodWeekRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    if (!studentId || weekStarts.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const minD = weekStarts.reduce((a, b) => (a < b ? a : b));
    const maxD = weekStarts.reduce((a, b) => (a > b ? a : b));

    const [{ data: studentRows }, { data: memberships }] = await Promise.all([
      supabase
        .from("training_period_weeks")
        .select("id, student_id, week_start, phase, notes")
        .eq("student_id", studentId)
        .gte("week_start", minD)
        .lte("week_start", maxD),
      supabase.from("group_members").select("group_id").eq("student_id", studentId),
    ]);

    const groupIds = memberships?.map((m) => m.group_id) ?? [];
    let groupRows: TrainingPeriodWeekRow[] = [];
    if (groupIds.length > 0) {
      const { data: gr } = await supabase
        .from("group_training_period_weeks")
        .select("id, group_id, week_start, phase, notes")
        .in("group_id", groupIds)
        .gte("week_start", minD)
        .lte("week_start", maxD);
      groupRows = (gr ?? []) as TrainingPeriodWeekRow[];
    }
    const normalizedStudentRows = (studentRows ?? []) as TrainingPeriodWeekRow[];

    const byWeek = new Map<string, TrainingPeriodWeekRow>();
    const sortedGroup = [...groupRows].sort((a, b) => {
      const g = (a.group_id || "").localeCompare(b.group_id || "");
      if (g !== 0) return g;
      return a.week_start.localeCompare(b.week_start);
    });
    for (const r of sortedGroup) {
      if (!byWeek.has(r.week_start)) byWeek.set(r.week_start, r);
    }
    for (const r of normalizedStudentRows) {
      byWeek.set(r.week_start, r);
    }
    setRows(Array.from(byWeek.values()));
    setLoading(false);
  }, [studentId, weekStarts]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  return { rows, loading, refetch: fetchRows };
}
