// ── Exercise Types ──────────────────────────────────────────────

export type ExerciseType = 'single' | 'bi-set' | 'combined';

// ── Conditioning Format Types ───────────────────────────────────

export type FormatType =
  | 'AMRAP'
  | 'FOR_TIME'
  | 'EMOM'
  | 'E2MOM'
  | 'E3MOM'
  | 'E4MOM'
  | 'E5MOM'
  | 'E6MOM'
  | 'CIRCUITO'
  | 'INTERVALADO'
  | 'NOT_FOR_TIME'
  | 'ROUNDS_FIXOS';

// ── Token Types (Tokenizer Output) ─────────────────────────────

export type TokenType =
  | 'BLOCK_HEADER'
  | 'EXERCISE'
  | 'EXERCISE_BISET'
  | 'EXERCISE_COMBINED'
  | 'SEPARATOR'
  | 'FORMAT_INDICATOR'
  | 'PRESCRIPTION'
  | 'TEXT'
  | 'EMPTY';

export interface Token {
  type: TokenType;
  raw: string;
  line: number;
  value: Record<string, string>;
}

// ── Parsed Structures ───────────────────────────────────────────

export interface ParsedPrescription {
  sets?: string;
  reps?: string;
  load?: string;
  interval?: string;
  duration?: string;
  distance?: string;
  pace?: string;
  rounds?: string;
  videoUrl?: string;
  notes?: string;
}

export interface ParsedExercise {
  name: string;
  type: ExerciseType;
  prescription: ParsedPrescription;
  biSetPartner?: string;
  biSetLabel?: string; // "A1", "A2", "B1", "B2", etc.
}

export interface ParsedBlock {
  title: string;
  category: string;
  formatType: FormatType | null;
  exercises: ParsedExercise[];
  rounds?: string;
  timeCap?: string;
  scoreType?: string;
  notes?: string;
}

export interface ParsedWorkout {
  blocks: ParsedBlock[];
  globalNotes?: string;
}

// ── Format Detection Result ─────────────────────────────────────

export interface FormatDetectionResult {
  formatType: FormatType;
  rounds?: string;
  timeCap?: string;
  scoreType?: string;
}
