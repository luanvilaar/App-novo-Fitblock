import { normalizeExerciseNameForCatalog, type ExerciseCatalogEntry } from './parsed-to-workout-items';

/**
 * Encontra o movimento do catálogo alinhado ao nome vindo do parser:
 * 1) igualdade exata (após normalização);
 * 2) o texto parseado começa com o nome canónico + espaço (ex.: "back squat costas" → "back squat");
 * 3) desempate: nome canónico normalizado com maior comprimento.
 */
export function resolveCatalogEntry(
  parsedName: string,
  catalog: ExerciseCatalogEntry[],
): ExerciseCatalogEntry | null {
  const normParsed = normalizeExerciseNameForCatalog(parsedName);
  if (!normParsed) {
    return null;
  }

  const candidates: ExerciseCatalogEntry[] = [];
  for (const e of catalog) {
    const normCat = normalizeExerciseNameForCatalog(e.name);
    if (!normCat) {
      continue;
    }
    if (normParsed === normCat) {
      candidates.push(e);
    } else if (normParsed.startsWith(`${normCat} `)) {
      candidates.push(e);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  let best: ExerciseCatalogEntry = candidates[0]!;
  let bestLen = normalizeExerciseNameForCatalog(best.name).length;
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i]!;
    const len = normalizeExerciseNameForCatalog(c.name).length;
    if (len > bestLen) {
      best = c;
      bestLen = len;
    }
  }
  return best;
}
