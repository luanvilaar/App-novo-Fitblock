import type { ParsedExercise, ParsedWorkout } from '@/lib/workoutParser';
import { resolveCatalogEntry } from './resolve-catalog';

/** Catálogo mínimo para resolver exercise_id / video_url */
export interface ExerciseCatalogEntry {
  id: string;
  name: string;
  video_url?: string | null;
}

export interface WorkoutItemExercise {
  type: 'exercise';
  exercise_id: string;
  /** Nome vindo do texto inteligente; usar na UI quando ainda não há match no catálogo */
  parsed_name: string;
  sets: number;
  reps: string;
  reps_scheme?: string[];
  suggested_load: string;
  load_scheme?: string[];
  notes: string;
  superset_group_id: string;
  video_url: string;
  block_category: string;
}

export interface WorkoutItemMetcon {
  type: 'metcon';
  metcon_title: string;
  metcon_description: string;
  metcon_type: string;
  is_ranking_reference: boolean;
  /** Para o fluxo TrainerWorkouts (categoria do bloco livre) */
  block_category?: string;
}

export type ConvertedWorkoutItem = WorkoutItemExercise | WorkoutItemMetcon;

const RANGE_RE = /^(\d+)-(\d+)$/;

export function normalizeExerciseNameForCatalog(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
}

/**
 * Expande reps prescritas para o campo base + grelha por série.
 * Faixa `12-15` → base e células = limite superior; a faixa deve ir para notes (via rangeForNotes).
 */
export function expandRepsScheme(
  sets: number,
  reps: string | undefined,
): { repsSummary: string; reps_scheme: string[]; rangeForNotes: string | null } {
  const n = Math.max(1, sets);
  const raw = (reps || '').trim();

  if (!raw) {
    return {
      repsSummary: '',
      reps_scheme: Array.from({ length: n }, () => ''),
      rangeForNotes: null,
    };
  }

  const rangeMatch = raw.match(RANGE_RE);
  if (rangeMatch) {
    const upper = rangeMatch[2];
    return {
      repsSummary: upper,
      reps_scheme: Array.from({ length: n }, () => upper),
      rangeForNotes: `${rangeMatch[1]}-${rangeMatch[2]}`,
    };
  }

  if (raw.includes('-')) {
    const parts = raw.split('-').filter((p) => p.length > 0);
    if (parts.length >= 2 && parts.every((p) => /^\d+$/.test(p))) {
      if (parts.length === n) {
        return {
          repsSummary: raw,
          reps_scheme: [...parts],
          rangeForNotes: null,
        };
      }
      const fill = parts[0] || raw;
      return {
        repsSummary: raw,
        reps_scheme: Array.from({ length: n }, () => fill),
        rangeForNotes: null,
      };
    }
  }

  return {
    repsSummary: raw,
    reps_scheme: Array.from({ length: n }, () => raw),
    rangeForNotes: null,
  };
}

export function normalizeExerciseNotes(
  rangeForNotes: string | null,
  existingNoteParts: string[],
): string {
  const parts: string[] = [];
  if (rangeForNotes) {
    parts.push(`Faixa alvo: ${rangeForNotes}.`);
  }
  parts.push(...existingNoteParts.filter(Boolean));
  return parts.join(' ').trim();
}

export function formatTypeToMetconType(formatType?: string | null): string {
  const ft = (formatType || '').toUpperCase();
  if (ft.includes('FOR_TIME')) return 'FOR TIME';
  if (ft.includes('AMRAP')) return 'AMRAP';
  if (
    ft.includes('EMOM') ||
    ft.includes('E2MOM') ||
    ft.includes('E3MOM') ||
    ft.includes('E4MOM') ||
    ft.includes('E5MOM') ||
    ft.includes('E6MOM')
  ) {
    return 'EMOM';
  }
  if (ft.includes('INTERVAL')) return 'INTERVALADO';
  if (ft.includes('CIRCUITO')) return 'CIRCUITO';
  return 'FOR TIME';
}

export function buildMetconDescriptionFromParsed(block: ParsedWorkout['blocks'][number]): string {
  const lines: string[] = [];
  if (block.notes?.trim()) {
    lines.push(block.notes.trim());
  }
  for (const ex of block.exercises) {
    const parts: string[] = [];
    if (ex.sets && ex.distance && !ex.reps) {
      parts.push(`${ex.sets} x ${ex.distance}`);
    } else {
      if (ex.distance) parts.push(ex.distance);
      if (ex.reps) parts.push(ex.reps);
    }
    parts.push(ex.name);
    if (ex.load) parts.push(ex.load);
    if (ex.duration) parts.push(ex.duration);
    if (ex.pace) parts.push(ex.pace);
    const line = parts.filter(Boolean).join(' ').trim();
    if (line) lines.push(line);
    if (ex.notes?.trim()) lines.push(ex.notes.trim());
  }
  if (block.timeCap) {
    lines.push(`Time cap: ${block.timeCap}min`);
  }
  return lines.join('\n');
}

function inferMetconBlockCategory(blockTitle: string): string {
  const u = blockTitle.toUpperCase();
  if (u.includes('METCON') || u.includes('WOD')) return 'Metcon';
  return 'Condicionamento';
}

export interface ParsedToWorkoutItemsResult {
  items: ConvertedWorkoutItem[];
  missingCatalogCount: number;
}

/**
 * Converte o resultado do parse smart em itens do formulário (exercícios + metcons).
 */
export function parsedWorkoutToWorkoutItems(
  parsed: ParsedWorkout,
  catalog: ExerciseCatalogEntry[],
): ParsedToWorkoutItemsResult {
  const biSetGroupByLetter = new Map<string, string>();
  let missingCatalogCount = 0;
  const items: ConvertedWorkoutItem[] = [];

  for (const block of parsed.blocks) {
    const titleUpper = (block.title || '').toUpperCase();
    const isFreeBlock =
      !!block.formatType ||
      ['CONDICIONAMENTO', 'METCON', 'WOD'].some((k) => titleUpper.includes(k));

    if (isFreeBlock) {
      items.push({
        type: 'metcon',
        metcon_title: block.title || '',
        metcon_description: buildMetconDescriptionFromParsed(block),
        metcon_type: formatTypeToMetconType(block.formatType),
        is_ranking_reference: items.every((i) => i.type !== 'metcon'),
        block_category: inferMetconBlockCategory(block.title || ''),
      });
      continue;
    }

    for (const ex of block.exercises) {
      const catalogEntry = resolveCatalogEntry(ex.name, catalog);
      if (!catalogEntry) {
        missingCatalogCount++;
      }

      let groupId = '';
      if (ex.isBiSet && ex.biSetLabel) {
        const letter = ex.biSetLabel[0];
        if (!biSetGroupByLetter.has(letter)) {
          biSetGroupByLetter.set(letter, crypto.randomUUID().slice(0, 8));
        }
        groupId = biSetGroupByLetter.get(letter)!;
      }

      const sets = Number(ex.sets || 1);
      const { repsSummary, reps_scheme, rangeForNotes } = expandRepsScheme(sets, ex.reps);
      const load = ex.load || '';
      const load_scheme = Array.from({ length: Math.max(1, sets) }, () => load);

      const metaParts = [ex.notes].filter(Boolean) as string[];
      if (ex.distance) metaParts.push(`Distância: ${ex.distance}`);
      if (ex.duration) metaParts.push(`Tempo: ${ex.duration}`);
      if (ex.pace) metaParts.push(String(ex.pace));
      if (ex.rounds) metaParts.push(`Rounds: ${ex.rounds}`);

      const notesJoined = metaParts.join(' | ');
      const notes = normalizeExerciseNotes(rangeForNotes, notesJoined ? [notesJoined] : []);

      items.push({
        type: 'exercise',
        exercise_id: catalogEntry?.id || '',
        parsed_name: ex.name || '',
        sets: Math.max(1, sets),
        reps: repsSummary,
        reps_scheme,
        suggested_load: load,
        load_scheme,
        notes,
        superset_group_id: groupId || '',
        video_url: catalogEntry?.video_url || '',
        block_category: block.title || 'geral',
      });
    }
  }

  return { items, missingCatalogCount };
}
