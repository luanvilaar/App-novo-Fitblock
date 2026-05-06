import { parseWorkoutText, type ParsedBlock, type ParsedExercise, type ParsedWorkout } from '@/lib/workoutParser';
import { classifyMovement, type VolumeMovementCategory } from './classify';

export type VolumeUnit = 'reps' | 'meters';

export interface WeeklyVolumeRow {
  /** Chave estável para merge (categoria + unidade + rótulo) */
  key: string;
  label: string;
  category: VolumeMovementCategory;
  unit: VolumeUnit;
  total: number;
}

export interface WorkoutVolumeSource {
  id: string;
  title: string;
  date: string;
}

function isConditioningBlock(block: ParsedBlock): boolean {
  if (block.formatType) return true;
  const upper = block.title.toUpperCase();
  return ['CONDICIONAMENTO', 'WOD', 'METCON', 'ENDURANCE'].some((k) => upper.includes(k));
}

function parseDistanceMeters(distance: string | undefined): number | null {
  if (!distance) return null;
  const km = distance.match(/(\d+[\.,]?\d*)\s*km\b/i);
  if (km) return Math.round(parseFloat(km[1].replace(',', '.')) * 1000);
  const m = distance.match(/(\d+[\.,]?\d*)\s*m(?:etros?)?\b/i);
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')));
  return null;
}

function parseRepsContribution(reps: string | undefined): number | null {
  if (!reps) return null;
  const t = reps.trim();
  if (/^\d+(-\d+)+$/.test(t)) {
    return t.split('-').reduce((s, x) => s + parseInt(x, 10), 0);
  }
  const range = t.match(/^(\d+)-(\d+)$/);
  if (range) return parseInt(range[2], 10);
  const single = t.match(/^(\d+)/);
  if (single) return parseInt(single[1], 10);
  return null;
}

function lineBaseContribution(ex: ParsedExercise): { unit: VolumeUnit; value: number } | null {
  const meters = parseDistanceMeters(ex.distance);
  if (meters != null && meters > 0) {
    return { unit: 'meters', value: meters };
  }
  const sets = ex.sets ? parseInt(String(ex.sets), 10) : 1;
  const reps = parseRepsContribution(ex.reps);
  if (reps != null && Number.isFinite(sets) && sets >= 1) {
    return { unit: 'reps', value: sets * reps };
  }
  return null;
}

function getRoundMultiplier(block: ParsedBlock): number {
  const raw = block.rounds ? parseInt(String(block.rounds), 10) : NaN;
  const rounds = Number.isFinite(raw) && raw >= 1 ? raw : 1;
  if (rounds === 1) return 1;

  const ft = block.formatType || '';
  if (ft === 'AMRAP') return 1;

  const emomFamily = ft === 'EMOM' || /^E\d+MOM$/.test(ft);
  const multiply =
    emomFamily ||
    ft === 'CIRCUITO' ||
    ft === 'INTERVALADO' ||
    ft === 'ROUNDS_FIXOS' ||
    ft === 'FOR_TIME' ||
    ft === 'NOT_FOR_TIME';

  return multiply ? rounds : 1;
}

function buildRowKey(category: VolumeMovementCategory, unit: VolumeUnit, label: string): string {
  return `${category}|${unit}|${label}`;
}

function exerciseLabel(ex: ParsedExercise): string {
  const load = ex.load?.trim();
  return load ? `${ex.name.trim()} ${load}` : ex.name.trim();
}

/**
 * Agrega volume de um bloco de condicionamento (repetições ou metros).
 */
export function aggregateConditioningBlock(block: ParsedBlock): Map<string, { category: VolumeMovementCategory; unit: VolumeUnit; label: string; total: number }> {
  const out = new Map<string, { category: VolumeMovementCategory; unit: VolumeUnit; label: string; total: number }>();
  const mult = getRoundMultiplier(block);
  const template = new Map<string, { category: VolumeMovementCategory; unit: VolumeUnit; label: string; value: number }>();

  for (const ex of block.exercises) {
    if (ex.isBiSet || ex.isCombined) continue;
    const contrib = lineBaseContribution(ex);
    if (!contrib || contrib.value <= 0) continue;

    const category = classifyMovement(ex.name, ex.load);
    const label = exerciseLabel(ex);
    const key = buildRowKey(category, contrib.unit, label);
    const prev = template.get(key);
    if (prev) {
      prev.value += contrib.value;
    } else {
      template.set(key, { category, unit: contrib.unit, label, value: contrib.value });
    }
  }

  for (const [, row] of template) {
    const total = row.value * mult;
    const key = buildRowKey(row.category, row.unit, row.label);
    const existing = out.get(key);
    if (existing) existing.total += total;
    else out.set(key, { category: row.category, unit: row.unit, label: row.label, total });
  }

  return out;
}

function mergeParsedWorkoutVolumes(parsed: ParsedWorkout): Map<string, { category: VolumeMovementCategory; unit: VolumeUnit; label: string; total: number }> {
  const merged = new Map<string, { category: VolumeMovementCategory; unit: VolumeUnit; label: string; total: number }>();

  for (const block of parsed.blocks) {
    if (!isConditioningBlock(block)) continue;
    const part = aggregateConditioningBlock(block);
    for (const [k, v] of part) {
      const prev = merged.get(k);
      if (prev) prev.total += v.total;
      else merged.set(k, { ...v });
    }
  }
  return merged;
}

/**
 * Soma o volume de condicionamento de vários treinos (texto smart) na semana.
 */
export function aggregateWeeklyConditioningVolume(
  workouts: Array<{ description: string | null }>,
): WeeklyVolumeRow[] {
  const totals = new Map<string, { category: VolumeMovementCategory; unit: VolumeUnit; label: string; total: number }>();

  for (const w of workouts) {
    if (!w.description?.trim()) continue;
    const parsed = parseWorkoutText(w.description);
    const part = mergeParsedWorkoutVolumes(parsed);
    for (const [k, v] of part) {
      const prev = totals.get(k);
      if (prev) prev.total += v.total;
      else totals.set(k, { ...v });
    }
  }

  const rows: WeeklyVolumeRow[] = [];
  for (const [key, v] of totals) {
    rows.push({
      key,
      label: v.label,
      category: v.category,
      unit: v.unit,
      total: Math.round(v.total),
    });
  }

  const order: VolumeMovementCategory[] = ['ginastico', 'peso', 'metcon'];
  rows.sort((a, b) => {
    const io = order.indexOf(a.category) - order.indexOf(b.category);
    if (io !== 0) return io;
    return a.label.localeCompare(b.label, 'pt-BR');
  });

  return rows;
}
