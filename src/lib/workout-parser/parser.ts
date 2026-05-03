import type {
  Token,
  ParsedWorkout,
  ParsedBlock,
  ParsedExercise,
  FormatType,
} from './types';
import { tokenize } from './tokenizer';
import { parsePrescriptionLine, mergePrescription } from './prescription-parser';
import { detectFormat, isPerSetIntervalLine } from './format-detector';

// ── Parser State Machine ────────────────────────────────────────

type ParserState = 'IDLE' | 'IN_BLOCK' | 'IN_EXERCISE' | 'IN_NOTES';

interface ParserContext {
  state: ParserState;
  workout: ParsedWorkout;
  currentBlock: ParsedBlock | null;
  currentExercise: ParsedExercise | null;
  pendingBiSet: boolean;
  biSetCounter: number; // 0 = A, 1 = B, 2 = C, ...
}

function createContext(): ParserContext {
  return {
    state: 'IDLE',
    workout: { blocks: [] },
    currentBlock: null,
    currentExercise: null,
    pendingBiSet: false,
    biSetCounter: 0,
  };
}

function getBiSetLetter(index: number): string {
  return String.fromCharCode(65 + index); // 0→A, 1→B, 2→C...
}

function ensureBlock(ctx: ParserContext): ParsedBlock {
  if (!ctx.currentBlock) {
    ctx.currentBlock = {
      title: 'Geral',
      category: 'Geral',
      formatType: null,
      exercises: [],
    };
    ctx.workout.blocks.push(ctx.currentBlock);
    ctx.state = 'IN_BLOCK';
  }
  return ctx.currentBlock;
}

// ── Token Handlers ──────────────────────────────────────────────

function handleBlockHeader(ctx: ParserContext, token: Token): void {
  // Accept headers like "*FORÇA*" and "**FORÇA**" (or any extra asterisks),
  // always normalizing to the clean title text.
  const title = (token.value.title || token.raw.trim()).replace(/\*/g, '').trim();
  ctx.currentBlock = {
    title: title,
    category: title, // A categoria herda o título do bloco
    formatType: null,
    exercises: [],
  };
  ctx.workout.blocks.push(ctx.currentBlock);
  ctx.currentExercise = null;
  ctx.pendingBiSet = false;
  ctx.biSetCounter = 0;
  ctx.state = 'IN_BLOCK';
}

function handleExercise(ctx: ParserContext, token: Token): void {
  const block = ensureBlock(ctx);
  const name = token.value.name || '';

  const exercise: ParsedExercise = {
    name,
    type: 'single',
    prescription: {},
  };

  // If previous exercise was a bi-set marker, link them
  if (ctx.pendingBiSet && ctx.currentExercise) {
    const letter = getBiSetLetter(ctx.biSetCounter);
    ctx.currentExercise.type = 'bi-set';
    ctx.currentExercise.biSetPartner = name;
    ctx.currentExercise.biSetLabel = `${letter}1`;
    exercise.type = 'bi-set';
    exercise.biSetPartner = ctx.currentExercise.name;
    exercise.biSetLabel = `${letter}2`;
    ctx.biSetCounter++;
    ctx.pendingBiSet = false;
  }

  block.exercises.push(exercise);
  ctx.currentExercise = exercise;
  ctx.state = 'IN_EXERCISE';
}

function handleExerciseBiSet(ctx: ParserContext, token: Token): void {
  const block = ensureBlock(ctx);
  const name = token.value.name || '';

  const exercise: ParsedExercise = {
    name,
    type: 'single', // will become 'bi-set' when partner is found
    prescription: {},
  };

  block.exercises.push(exercise);
  ctx.currentExercise = exercise;
  ctx.pendingBiSet = true;
  ctx.state = 'IN_EXERCISE';
}

function handleExerciseCombined(ctx: ParserContext, token: Token): void {
  const block = ensureBlock(ctx);
  const name = token.value.name || '';

  const exercise: ParsedExercise = {
    name,
    type: 'combined',
    prescription: {},
  };

  block.exercises.push(exercise);
  ctx.currentExercise = exercise;
  ctx.pendingBiSet = false;
  ctx.state = 'IN_EXERCISE';
}

function handleSeparator(ctx: ParserContext, token: Token): void {
  const dashCount = parseInt(token.value.dashes || '3', 10);

  // 3–6 traços: notas globais a seguir (ex.: ------ antes do score)
  if (dashCount >= 3 && dashCount <= 6) {
    ctx.state = 'IN_NOTES';
    ctx.currentExercise = null;
  } else if (dashCount >= 7) {
    // Separador longo (--------): mantém-se no bloco (ex.: VERSÃO ALTERNATIVA no condicionamento)
    const block = ensureBlock(ctx);
    block.notes = (block.notes || '') + token.raw.trim() + '\n';
    ctx.currentExercise = null;
  } else {
    ctx.currentExercise = null;
  }
}

function handleFormatIndicator(ctx: ParserContext, token: Token): void {
  const block = ensureBlock(ctx);

  // TIME_CAP meta line (e.g., "Time cap: 22min")
  if (token.value.format === 'TIME_CAP') {
    const tcRaw = token.value.timeCap || '';
    // Extract just the number from "22min", "15'", "20 min", etc.
    const numMatch = tcRaw.match(/(\d+)/);
    if (numMatch) {
      block.timeCap = numMatch[1];
    } else {
      block.timeCap = tcRaw;
    }
    return;
  }

  const detected = detectFormat(token.raw);

  if (detected) {
    block.formatType = detected.formatType;
    if (detected.rounds) block.rounds = detected.rounds;
    if (detected.timeCap) block.timeCap = detected.timeCap;
    if (detected.scoreType) block.scoreType = detected.scoreType;
  }
}

function handlePrescription(ctx: ParserContext, token: Token): void {
  const text = token.value.text || token.raw.trim();
  const parsed = parsePrescriptionLine(text);

  if (ctx.currentExercise) {
    ctx.currentExercise.prescription = mergePrescription(
      ctx.currentExercise.prescription,
      parsed
    );
  } else {
    // Prescription without exercise context — might be inline exercise
    // e.g., "10 Burpees" or just a number line in a conditioning block
    const block = ensureBlock(ctx);

    if (isPerSetIntervalLine(text)) {
      if (!block.formatType) {
        block.formatType = 'INTERVALADO';
        const rm = text.match(/\bpor\s+(\d+)\s*sets?\b/i);
        if (rm) block.rounds = rm[1];
      }
      block.notes = (block.notes || '') + text + '\n';
      return;
    }

    const words = text.split(/\s+/);
    const startsWithNumber = /^\d+/.test(text);

    if (startsWithNumber && words.length > 1) {
      const reps = words[0];
      const name = words.slice(1).join(' ');
      const exercise: ParsedExercise = {
        name,
        type: 'single',
        prescription: { reps },
      };
      block.exercises.push(exercise);
      ctx.currentExercise = exercise;
      ctx.state = 'IN_EXERCISE';
    } else {
      block.notes = (block.notes || '') + text + '\n';
    }
  }
}

// Check if a text line looks like an inline exercise
// "10 Burpees", "35 Goblet Squat #32/24kg", "500m Corrida"
const INLINE_NUM_RE = /^(\d+)\s+([a-zA-ZÀ-ÿ].{2,})$/;
const INLINE_DIST_RE = /^(\d+\s*(?:m|km))\s+([a-zA-ZÀ-ÿ].{2,})$/i;

function parseInlineExercise(text: string): { reps?: string; distance?: string; name: string } | null {
  if (text.length >= 80) return null;

  // Distance + name: "500m Corrida"
  const distMatch = text.match(INLINE_DIST_RE);
  if (distMatch) {
    return { distance: distMatch[1].trim(), name: distMatch[2].trim() };
  }

  // Number + name: "10 Burpees", "35 Goblet Squat #32/24kg"
  const numMatch = text.match(INLINE_NUM_RE);
  if (numMatch) {
    return { reps: numMatch[1], name: numMatch[2].trim() };
  }

  return null;
}

function isInlineExercise(text: string): boolean {
  return parseInlineExercise(text) !== null;
}

/** Ex.: "2 x 6m Handstand Walk #unbk" */
const SETSX_DISTANCE_NAME_RE = /^(\d+)\s*x\s*(\d+[\.,]?\d*)\s*(m|km)\s+(.+)$/i;

function handleText(ctx: ParserContext, token: Token): void {
  const text = token.value.text || token.raw.trim();

  if (ctx.state === 'IN_NOTES') {
    ctx.workout.globalNotes = (ctx.workout.globalNotes || '') + text + '\n';
    return;
  }

  const block = ensureBlock(ctx);
  const words = text.split(/\s+/);
  const startsWithNumber = /^\d+/.test(text);

  const distSetsMatch = text.match(SETSX_DISTANCE_NAME_RE);
  if (distSetsMatch) {
    let exerciseName = distSetsMatch[4].trim();
    let load: string | undefined;
    const loadSuffix = exerciseName.match(/\s+(#[^\s#]+(?:\s*kg)?)\s*$/i);
    if (loadSuffix) {
      load = loadSuffix[1].trim();
      exerciseName = exerciseName.slice(0, loadSuffix.index!).trim();
    }

    const exercise: ParsedExercise = {
      name: exerciseName,
      type: 'single',
      prescription: {
        sets: distSetsMatch[1],
        distance: `${distSetsMatch[2]}${distSetsMatch[3]}`,
        ...(load ? { load } : {}),
      },
    };
    block.exercises.push(exercise);
    ctx.currentExercise = exercise;
    ctx.state = 'IN_EXERCISE';
    return;
  }

  // Inline exercise pattern: "10 Burpees", "35 Goblet Squat #32/24kg", "500m Corrida"
  // This takes priority even if currentExercise exists
  const inlineEx = parseInlineExercise(text);
  if (inlineEx) {
    // Extract load suffix if present (e.g., "#32/24kg" from "Goblet Squat #32/24kg")
    let exerciseName = inlineEx.name;
    let load: string | undefined;
    const loadSuffix = exerciseName.match(/\s+(#[\d/]+\s*(?:kg|lbs?)?)\s*$/i);
    if (loadSuffix) {
      load = loadSuffix[1];
      exerciseName = exerciseName.slice(0, loadSuffix.index!).trim();
    }

    const exercise: ParsedExercise = {
      name: exerciseName,
      type: 'single',
      prescription: {
        ...(inlineEx.reps ? { reps: inlineEx.reps } : {}),
        ...(inlineEx.distance ? { distance: inlineEx.distance } : {}),
        ...(load ? { load } : {}),
      },
    };
    block.exercises.push(exercise);
    ctx.currentExercise = exercise;
    ctx.state = 'IN_EXERCISE';
    return;
  }

  // If we're waiting for a bi-set partner, allow a short TEXT line to act as the next exercise name.
  // This supports inputs like:
  // <Shoulder Press>+
  // 4 x 8-10
  // Dumbbell Shoulder Front Raise
  // 4 x 8-10
  if (ctx.pendingBiSet && ctx.currentExercise) {
    const looksLikeExerciseName = words.length <= 6 && text.length < 60;
    if (looksLikeExerciseName) {
      const block = ensureBlock(ctx);
      const name = text;
      const exercise: ParsedExercise = {
        name,
        type: 'single',
        prescription: {},
      };

      const letter = getBiSetLetter(ctx.biSetCounter);
      ctx.currentExercise.type = 'bi-set';
      ctx.currentExercise.biSetPartner = name;
      ctx.currentExercise.biSetLabel = `${letter}1`;
      exercise.type = 'bi-set';
      exercise.biSetPartner = ctx.currentExercise.name;
      exercise.biSetLabel = `${letter}2`;
      ctx.biSetCounter++;
      ctx.pendingBiSet = false;

      block.exercises.push(exercise);
      ctx.currentExercise = exercise;
      ctx.state = 'IN_EXERCISE';
      return;
    }
  }

  if (ctx.currentExercise) {
    // Text after an exercise = notes for that exercise
    ctx.currentExercise.prescription = mergePrescription(
      ctx.currentExercise.prescription,
      { notes: text }
    );
    return;
  }

  // Short text in a block = potential exercise name
  if (words.length <= 5 && text.length < 50) {
    const exercise: ParsedExercise = {
      name: text,
      type: 'single',
      prescription: {},
    };
    block.exercises.push(exercise);
    ctx.currentExercise = exercise;
    ctx.state = 'IN_EXERCISE';
  } else {
    block.notes = (block.notes || '') + text + '\n';
  }
}

// ── Main Parse Function ─────────────────────────────────────────

export function parseWorkoutText(text: string): ParsedWorkout {
  const tokens = tokenize(text);
  const ctx = createContext();

  for (const token of tokens) {
    if (token.type === 'EMPTY') continue;

    // In notes mode, everything except tokens that would start a new block goes to notes
    if (ctx.state === 'IN_NOTES' && token.type !== 'BLOCK_HEADER') {
      ctx.workout.globalNotes = (ctx.workout.globalNotes || '') +
        (token.value.text || token.value.name || token.raw.trim()) + '\n';
      continue;
    }

    switch (token.type) {
      case 'BLOCK_HEADER':
        handleBlockHeader(ctx, token);
        break;
      case 'EXERCISE':
        handleExercise(ctx, token);
        break;
      case 'EXERCISE_BISET':
        handleExerciseBiSet(ctx, token);
        break;
      case 'EXERCISE_COMBINED':
        handleExerciseCombined(ctx, token);
        break;
      case 'SEPARATOR':
        handleSeparator(ctx, token);
        break;
      case 'FORMAT_INDICATOR':
        handleFormatIndicator(ctx, token);
        break;
      case 'PRESCRIPTION':
        handlePrescription(ctx, token);
        break;
      case 'TEXT':
        handleText(ctx, token);
        break;
    }
  }

  applyInheritance(ctx.workout);

  // Trim trailing newlines from notes
  if (ctx.workout.globalNotes) {
    ctx.workout.globalNotes = ctx.workout.globalNotes.trimEnd();
  }
  for (const block of ctx.workout.blocks) {
    if (block.notes) {
      block.notes = block.notes.trimEnd();
    }
  }

  return ctx.workout;
}

/**
 * Finalize the workout parsing by applying inheritance rules.
 * Rule: Bi-set partners inherit prescription if they don't have their own.
 */
function applyInheritance(workout: ParsedWorkout): void {
  for (const block of workout.blocks) {
    for (let i = 0; i < block.exercises.length; i++) {
      const ex = block.exercises[i];
      if (ex.type === 'bi-set' && ex.biSetLabel?.endsWith('2') && i > 0) {
        const prev = block.exercises[i - 1];
        const hasPrescription = Object.keys(ex.prescription).length > 0;
        if (!hasPrescription && prev.type === 'bi-set' && prev.biSetLabel?.endsWith('1')) {
          ex.prescription = { ...prev.prescription };
        }
      }
    }
  }
}
