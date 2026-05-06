import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Alinhado ao select do calendário em ClientHome (volume / execução). */
export type StudentWorkoutRow = {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string | null;
  workout_exercises: { id: string }[];
};

/**
 * Treinos atribuídos ao aluno (student_id) mais treinos dos grupos (group_id in groupIds),
 * no intervalo [fromDate, toDate] (toDate opcional = sem limite superior).
 * Deduplica por id (mesmo treino em individual + grupo).
 *
 * Para janelas muito grandes (ex. anos), considere passar toDate (ex. hoje + 90d).
 */
export async function fetchStudentWorkoutsInRange(
  supabase: SupabaseClient<Database>,
  studentId: string,
  groupIds: string[],
  fromDate: string,
  toDate?: string
): Promise<StudentWorkoutRow[]> {
  let personal = supabase
    .from("workouts")
    .select("id, title, category, date, description, workout_exercises(id)")
    .eq("student_id", studentId)
    .gte("date", fromDate)
    .order("date", { ascending: true });
  if (toDate) personal = personal.lte("date", toDate);
  const { data: personalRows } = await personal;

  let all: StudentWorkoutRow[] = (personalRows || []) as StudentWorkoutRow[];

  if (groupIds.length > 0) {
    let groupQ = supabase
      .from("workouts")
      .select("id, title, category, date, description, workout_exercises(id)")
      .in("group_id", groupIds)
      .gte("date", fromDate)
      .order("date", { ascending: true });
    if (toDate) groupQ = groupQ.lte("date", toDate);
    const { data: groupRows } = await groupQ;
    if (groupRows?.length) {
      const existingIds = new Set(all.map((w) => w.id));
      all = [...all, ...(groupRows as StudentWorkoutRow[]).filter((w) => !existingIds.has(w.id))];
    }
  }

  return all;
}
