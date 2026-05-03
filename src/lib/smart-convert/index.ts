export {
  expandRepsScheme,
  normalizeExerciseNotes,
  normalizeExerciseNameForCatalog,
  formatTypeToMetconType,
  buildMetconDescriptionFromParsed,
  parsedWorkoutToWorkoutItems,
  type ExerciseCatalogEntry,
  type WorkoutItemExercise,
  type WorkoutItemMetcon,
  type ConvertedWorkoutItem,
  type ParsedToWorkoutItemsResult,
} from './parsed-to-workout-items';

export { ensureExerciseIdsResolved, type ExerciseItemLike } from './ensure-exercise-ids';
export { resolveCatalogEntry } from './resolve-catalog';
