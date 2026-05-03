export type WorkoutScope =
  | { kind: "all" }
  | { kind: "student"; studentId: string }
  | { kind: "group"; groupId: string };

export function workoutDraftStorageKey(scope: WorkoutScope): string {
  // Mesma chave histórica da página global de treinos
  if (scope.kind === "all") return "workout_draft";
  if (scope.kind === "student") return `workout_draft_scope_student_${scope.studentId}`;
  return `workout_draft_scope_group_${scope.groupId}`;
}
