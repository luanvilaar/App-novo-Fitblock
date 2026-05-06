import type { ParsedPrescription } from './types';

// ── Regex patterns ──────────────────────────────────────────────

const SETS_REPS_FULL_RE = /^(\d+)\s*x\s*(\d+[\d\-\/]*)/i;
const PYRAMID_RE = /^(\d+-){1,}\d+$/;
const REPS_ONLY_RE = /^(\d+)\s*(reps?|repetições?|rep)?$/i;

const LOAD_KG_RE = /(\d+[\.,]?\d*)\s*kg/i;
const LOAD_LBS_RE = /(\d+[\.,]?\d*)\s*lbs?/i;
const LOAD_PERCENT_RE = /(\d+[\.,]?\d*)\s*%/;

const TIME_MIN_RE = /(\d+)\s*(?:min(?:utos?)?|m(?:in)?|')/i;
const TIME_SEC_RE = /(\d+)\s*(?:seg(?:undos?)?|s(?:ec)?|")/i;
const TIME_COLON_RE = /(\d{1,2}:\d{2}(?::\d{2})?)/;

const DISTANCE_RE = /(\d+[\.,]?\d*)\s*(m(?:etros?)?|km|mi(?:les?)?)\b/i;

const PACE_RE = /\b(pace|ritmo)\b\s*:?\s*(.+)/i;
const INDIVIDUAL_ROUNDS_RE = /^(\d+)\s*(?:rounds?|rodadas?|séries|sets)\b/i;

const INTERVAL_KEYWORDS = /\b(intervalo|descanso|descanse|rest|pausa)\b/i;
const URL_RE = /(https?:\/\/[^\s]+)/i;
const EVERY_X_TIME_RE = /\b(a cada|every|cada)\b/i;

// ── Parser ──────────────────────────────────────────────────────

export function parsePrescriptionLine(line: string): ParsedPrescription {
  let result: ParsedPrescription = {};
  let remaining = line.trim();

  // 1. Extract URL if present
  const urlMatch = remaining.match(URL_RE);
  if (urlMatch) {
    result.videoUrl = urlMatch[1];
    remaining = remaining.replace(urlMatch[0], '').trim();
  }

  if (!remaining) return result;

  // 2. Check for "A cada ..." (Every X time) pattern - should go to notes
  if (EVERY_X_TIME_RE.test(remaining)) {
    result.notes = remaining;
    return result;
  }

  // 3. Sets x Reps (4x10, 4 x 10-12, 4x10/12)
  const setsRepsMatch = remaining.match(SETS_REPS_FULL_RE);
  if (setsRepsMatch) {
    result.sets = setsRepsMatch[1];
    result.reps = setsRepsMatch[2];
    remaining = remaining.replace(setsRepsMatch[0], '').trim();
  }

  // 4. Pyramid reps (21-15-9)
  const pyramidMatch = remaining.match(PYRAMID_RE);
  if (pyramidMatch) {
    result.reps = pyramidMatch[0];
    remaining = remaining.replace(pyramidMatch[0], '').trim();
  }

  // 5. Individual rounds (e.g., "4 rounds")
  const roundsMatch = remaining.match(INDIVIDUAL_ROUNDS_RE);
  if (roundsMatch) {
    result.rounds = roundsMatch[1];
    remaining = remaining.replace(roundsMatch[0], '').trim();
  }

  // 6. Check for interval/rest keyword first
  const intervalMatch = remaining.match(INTERVAL_KEYWORDS);
  if (intervalMatch) {
    result.interval = remaining; // Keep whole text for interval
    return result;
  }

  // 7. Pace/Ritmo
  const paceMatch = remaining.match(PACE_RE);
  if (paceMatch) {
    result.pace = paceMatch[0];
    remaining = remaining.replace(paceMatch[0], '').trim();
  }

  // 8. Load (60kg, 135lbs, 70%, @14)
  // Try @ syntax first: @ 14, @14kg, @70%
  const atLoadMatch = remaining.match(/@\s*(\d+[\.,]?\d*\s*(?:kg|lbs?|%)?)/i);
  if (atLoadMatch) {
    result.load = atLoadMatch[1].trim();
    remaining = remaining.replace(atLoadMatch[0], '').trim();
  }

  // Then try standard units if load not already found
  if (!result.load) {
    const kgMatch = remaining.match(LOAD_KG_RE);
    if (kgMatch) {
      result.load = kgMatch[0];
      remaining = remaining.replace(kgMatch[0], '').trim();
    } else {
      const lbsMatch = remaining.match(LOAD_LBS_RE);
      if (lbsMatch) {
        result.load = lbsMatch[0];
        remaining = remaining.replace(lbsMatch[0], '').trim();
      } else {
        const percentMatch = remaining.match(LOAD_PERCENT_RE);
        if (percentMatch) {
          result.load = percentMatch[0];
          remaining = remaining.replace(percentMatch[0], '').trim();
        }
      }
    }
  }

  // 9. Distance (500m, 1km)
  const distMatch = remaining.match(DISTANCE_RE);
  if (distMatch) {
    result.distance = distMatch[0];
    remaining = remaining.replace(distMatch[0], '').trim();
  }

  // 10. Time colon format (1:30, 2:00)
  const colonMatch = remaining.match(TIME_COLON_RE);
  if (colonMatch) {
    result.interval = colonMatch[1];
    remaining = remaining.replace(colonMatch[0], '').trim();
  }

  // 11. Time with units (30seg, 2min, 90s)
  const minMatch = remaining.match(TIME_MIN_RE);
  if (minMatch) {
    result.duration = minMatch[0];
    remaining = remaining.replace(minMatch[0], '').trim();
  }

  const secMatch = remaining.match(TIME_SEC_RE);
  if (secMatch && !result.interval) {
    result.interval = secMatch[0];
    remaining = remaining.replace(secMatch[0], '').trim();
  }

  // 12. Reps only (10 reps, 15)
  const repsOnlyMatch = remaining.match(REPS_ONLY_RE);
  if (repsOnlyMatch && !result.reps && !result.sets) {
    result.reps = repsOnlyMatch[1];
    remaining = remaining.replace(repsOnlyMatch[0], '').trim();
  }

  // Remove leading punctuation that might remain (like @ if not matched by atLoadMatch, or commas)
  remaining = remaining.replace(/^[\s,@]+/, '').trim();

  // If we have extracted something but still have text, or if we extracted nothing
  if (Object.keys(result).length === 0 || remaining) {
    // If it's just a fallback, use the whole remaining as notes
    if (remaining) {
      result.notes = result.notes ? `${result.notes} ${remaining}` : remaining;
    }
  }

  return result;
}

export function mergePrescription(
  existing: ParsedPrescription,
  addition: ParsedPrescription
): ParsedPrescription {
  const merged = { ...existing };

  if (addition.sets) merged.sets = addition.sets;
  if (addition.reps) merged.reps = merged.reps && !merged.sets ? `${merged.reps}, ${addition.reps}` : addition.reps;
  if (addition.load) merged.load = addition.load;
  if (addition.interval) merged.interval = addition.interval;
  if (addition.duration) merged.duration = addition.duration;
  if (addition.distance) merged.distance = addition.distance;
  if (addition.pace) merged.pace = addition.pace;
  if (addition.rounds) merged.rounds = addition.rounds;
  if (addition.videoUrl) merged.videoUrl = addition.videoUrl;
  if (addition.notes) merged.notes = merged.notes ? `${merged.notes} ${addition.notes}` : addition.notes;

  return merged;
}
