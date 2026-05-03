import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { isWorkoutExerciseSchemaError, stripWorkoutExerciseExtendedFields } from "@/lib/utils";

type WorkoutExerciseRow = Record<string, unknown>;

function buildExerciseCloneRows(newWorkoutId: string, workoutExercises: WorkoutExerciseRow[]): WorkoutExerciseRow[] {
  return workoutExercises.map((we) => {
    const row: WorkoutExerciseRow = {
      workout_id: newWorkoutId,
      exercise_id: we.exercise_id,
      sets: we.sets,
      reps: we.reps,
      suggested_load: we.suggested_load,
      notes: we.notes,
      block_label: we.block_label,
      sort_order: we.sort_order,
      superset_group_id: we.superset_group_id,
      video_url: we.video_url,
    };
    if (Array.isArray(we.reps_scheme) && we.reps_scheme.length) row.reps_scheme = we.reps_scheme;
    if (we.load_type) row.load_type = we.load_type;
    if (Array.isArray(we.load_scheme) && we.load_scheme.length) row.load_scheme = we.load_scheme;
    return row;
  });
}

async function insertClonedWorkoutExercises(newWorkoutId: string, workoutExercises: WorkoutExerciseRow[] | undefined) {
  if (!workoutExercises?.length) return;
  const rows = buildExerciseCloneRows(newWorkoutId, workoutExercises);
  const { error: dupExError } = await supabase.from("workout_exercises").insert(rows);
  if (dupExError && isWorkoutExerciseSchemaError(dupExError.message)) {
    const fallbackRows = rows.map((r) => stripWorkoutExerciseExtendedFields(r));
    const { error: fb } = await supabase.from("workout_exercises").insert(fallbackRows);
    if (fb) throw fb;
  } else if (dupExError) {
    throw dupExError;
  }
}

async function insertClonedMetcons(sourceWorkoutId: string, newWorkoutId: string) {
  const { data: metcons } = await supabase.from("workout_metcons").select("*").eq("workout_id", sourceWorkoutId);
  if (!metcons?.length) return;
  const metconRows = metcons.map((m: Record<string, unknown>) => ({
    workout_id: newWorkoutId,
    title: m.title,
    description: m.description,
    metcon_type: m.metcon_type,
    sort_order: m.sort_order,
    is_ranking_reference: m.is_ranking_reference === true,
  }));
  const { error: mErr } = await supabase.from("workout_metcons").insert(metconRows);
  if (mErr) throw mErr;
}

export async function duplicateTrainerWorkout(workoutId: string, trainerId: string): Promise<void> {
  const { data: original } = await supabase
    .from("workouts")
    .select("*, workout_exercises(*)")
    .eq("id", workoutId)
    .single();
  if (!original) return;

  const { data: newW } = await supabase
    .from("workouts")
    .insert({
      trainer_id: trainerId,
      title: String(original.title) + " (cópia)",
      category: original.category,
      date: format(new Date(), "yyyy-MM-dd"),
      description: original.description,
      is_group: original.is_group,
      group_id: original.group_id,
      student_id: original.student_id,
    })
    .select("id")
    .single();
  if (!newW) return;

  await insertClonedWorkoutExercises(newW.id, original.workout_exercises as WorkoutExerciseRow[] | undefined);
  await insertClonedMetcons(workoutId, newW.id);
}

/** Cópia do treino para outro atleta ou grupo, numa data escolhida (conteúdo idêntico). */
export async function copyTrainerWorkoutToTarget(
  sourceWorkoutId: string,
  trainerId: string,
  target: { type: "student"; studentId: string; date: string } | { type: "group"; groupId: string; date: string },
): Promise<void> {
  const { data: original, error: fetchErr } = await supabase
    .from("workouts")
    .select("*, workout_exercises(*)")
    .eq("id", sourceWorkoutId)
    .single();

  if (fetchErr || !original) {
    throw new Error(fetchErr?.message || "Treino não encontrado.");
  }

  const isStudent = target.type === "student";
  const { data: newW, error: insErr } = await supabase
    .from("workouts")
    .insert({
      trainer_id: trainerId,
      title: original.title,
      category: original.category,
      date: target.date,
      description: original.description,
      is_group: !isStudent,
      group_id: isStudent ? null : target.groupId,
      student_id: isStudent ? target.studentId : null,
    })
    .select("id")
    .single();

  if (insErr || !newW) {
    throw new Error(insErr?.message || "Não foi possível criar o treino de destino.");
  }

  await insertClonedWorkoutExercises(newW.id, original.workout_exercises as WorkoutExerciseRow[] | undefined);
  await insertClonedMetcons(sourceWorkoutId, newW.id);
}

export async function deleteTrainerWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
  if (error) throw error;
}
