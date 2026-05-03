/**
 * Backward-compatible adapter layer.
 *
 * Re-exports the new parser through the legacy interface shapes so that
 * every existing consumer (SmartWorkoutEditor, SmartWorkoutView,
 * WorkoutDetail, WorkoutExecution) continues to work with zero changes.
 */

import {
  parseWorkoutText as newParseWorkoutText,
  type ParsedWorkout as NewParsedWorkout,
} from './workout-parser';

// ── Legacy Interfaces (unchanged) ───────────────────────────────

export interface ParsedExercise {
  name: string;
  sets?: string;
  reps?: string;
  load?: string;
  distance?: string;
  duration?: string;
  pace?: string;
  rounds?: string;
  videoUrl?: string;
  notes?: string;
  isBiSet?: boolean;
  isCombined?: boolean;
  biSetLabel?: string; // "A1", "A2", "B1", "B2", etc.
}

export interface ParsedBlock {
  title: string;
  category: string;
  formatType?: string;
  exercises: ParsedExercise[];
  notes?: string;
  timeCap?: string;
  rounds?: string;
}

export interface ParsedWorkout {
  blocks: ParsedBlock[];
  globalNotes?: string;
}

// ── Adapter ─────────────────────────────────────────────────────

function adaptToLegacy(result: NewParsedWorkout): ParsedWorkout {
  return {
    blocks: result.blocks.map((block) => ({
      title: block.title,
      category: block.category,
      formatType: block.formatType ?? undefined,
      exercises: block.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.prescription.sets,
        reps: ex.prescription.reps,
        load: ex.prescription.load,
        distance: ex.prescription.distance,
        duration: ex.prescription.duration,
        pace: ex.prescription.pace,
        rounds: ex.prescription.rounds,
        videoUrl: ex.prescription.videoUrl,
        notes: [
          ex.prescription.interval,
          ex.prescription.notes,
        ]
          .filter(Boolean)
          .join(' ')
          || undefined,
        isBiSet: ex.type === 'bi-set',
        isCombined: ex.type === 'combined',
        biSetLabel: ex.biSetLabel,
      })),
      notes: block.notes,
      timeCap: block.timeCap,
      rounds: block.rounds,
    })),
    globalNotes: result.globalNotes,
  };
}

export function parseWorkoutText(text: string): ParsedWorkout {
  const newResult = newParseWorkoutText(text);
  return adaptToLegacy(newResult);
}
