import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Erros do PostgREST quando coluna não existe ou o cache do schema está desatualizado. */
export function isWorkoutExerciseSchemaError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("could not find") ||
    m.includes("does not exist") ||
    (m.includes("column") && m.includes("workout_exercises"))
  );
}

export function stripWorkoutExerciseExtendedFields(row: Record<string, unknown>) {
  const { reps_scheme, load_type, load_scheme, ...rest } = row;
  return rest;
}
