/** Normaliza para matching sem acentos e em minúsculas. */
export function normalizeExerciseLabel(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export type VolumeMovementCategory = 'ginastico' | 'peso' | 'metcon';

/**
 * Classifica movimento para o quadro semanal (Ginástico / Peso / Metcon).
 * Heurística alinhada a trackers tipo SugarWOD / btwb: cardio e corda → Metcon;
 * cargas explícitas ou movimentos típicos de implemento → Peso; resto → Ginástico.
 */
export function classifyMovement(name: string, load?: string): VolumeMovementCategory {
  const n = normalizeExerciseLabel(name);
  const hasLoad = !!(load && load.trim());

  if (/\bair\s+squat\b/.test(n)) return 'ginastico';

  const metcon =
    /\b(remo|rowing|erg|assault|air\s*bike|bike|bicicleta|ski|skierg|corrida|run|running)\b/.test(n) ||
    /\b(double\s*under|du|single\s*under|su|cross\s*over|crossover)\b/.test(n) ||
    /\bshuttle\b/.test(n) ||
    /\bcal(orias?)?\b/.test(n) ||
    /\b(minutos?|minute)\b/.test(n);

  if (metcon) return 'metcon';

  const pesoKeyword =
    /\b(kettlebell|goblet|dumbbell|haltere|barbell|wall\s*ball|wallball|deadlift|levantamento)\b/.test(
      n,
    ) ||
    /\b(thruster|clean|jerk|snatch|ground\s*to\s*overhead|gtoh|ohs|overhead\s*squat)\b/.test(n) ||
    /\b(push\s*press|push\s*jerk|strict\s*press|front\s*squat|back\s*squat|bench|farmer|sandbag)\b/.test(
      n,
    ) ||
    /\bsquat\b/.test(n) ||
    /\bkb\b/.test(n) ||
    /\bdb\b/.test(n);

  if (hasLoad || pesoKeyword) return 'peso';

  return 'ginastico';
}
