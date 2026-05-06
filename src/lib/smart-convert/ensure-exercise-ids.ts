import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeExerciseNameForCatalog, type ExerciseCatalogEntry } from './parsed-to-workout-items';
import { resolveCatalogEntry } from './resolve-catalog';

/** Item mínimo para resolver IDs (compatível com WorkoutItem nas páginas). */
export interface ExerciseItemLike {
  type: 'exercise' | 'metcon';
  exercise_id?: string;
  parsed_name?: string;
  [key: string]: unknown;
}

/**
 * Preenche exercise_id em itens convertidos sem match no catálogo:
 * 1) procura por nome normalizado (igual ao da conversão);
 * 2) se não existir, insere em `exercises` (categoria geral).
 */
export async function ensureExerciseIdsResolved(
  items: ExerciseItemLike[],
  supabase: SupabaseClient,
): Promise<{ items: ExerciseItemLike[]; createdCount: number; matchedCount: number }> {
  const { data: catalog, error: catErr } = await supabase
    .from('exercises')
    .select('id, name, video_url');
  if (catErr) throw catErr;

  const catalogEntries: ExerciseCatalogEntry[] = (catalog || []).map((e) => ({
    id: e.id,
    name: e.name,
    video_url: e.video_url,
  }));

  const byKey = new Map<string, { id: string; name: string }>();
  for (const e of catalog || []) {
    const k = normalizeExerciseNameForCatalog(e.name);
    if (k && !byKey.has(k)) {
      byKey.set(k, { id: e.id, name: e.name });
    }
  }

  let createdCount = 0;
  let matchedCount = 0;
  const result: ExerciseItemLike[] = [];

  for (const item of items) {
    if (item.type !== 'exercise') {
      result.push(item);
      continue;
    }
    if (String(item.exercise_id || '').trim()) {
      result.push(item);
      continue;
    }

    const rawName = String(item.parsed_name || '').trim();
    if (!rawName) {
      result.push(item);
      continue;
    }

    const key = normalizeExerciseNameForCatalog(rawName);
    let hit = key ? byKey.get(key) : undefined;
    let fromCatalog = Boolean(hit);
    if (!hit) {
      const resolved = resolveCatalogEntry(rawName, catalogEntries);
      if (resolved) {
        hit = { id: resolved.id, name: resolved.name };
        fromCatalog = true;
      }
    }

    if (!hit) {
      const { data: created, error: insErr } = await supabase
        .from('exercises')
        .insert({ name: rawName, category: 'geral' })
        .select('id, name')
        .single();

      if (insErr) {
        result.push(item);
        continue;
      }
      hit = { id: created.id, name: created.name };
      if (key) {
        byKey.set(key, hit);
      }
      createdCount++;
    } else if (fromCatalog) {
      matchedCount++;
    }

    result.push({
      ...item,
      exercise_id: hit.id,
    });
  }

  return { items: result, createdCount, matchedCount };
}
