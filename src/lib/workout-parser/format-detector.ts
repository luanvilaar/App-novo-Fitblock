import type { FormatType, FormatDetectionResult } from './types';

/** Intervalo por série (ex.: "A cada 1min30seg por 5sets") — não é formato EMOM do bloco inteiro. */
export function isPerSetIntervalLine(line: string): boolean {
  const t = line.trim();
  return /\bA\s+CADA\b/i.test(t) && /\bpor\s+\d+\s*(?:sets?|séries)\b/i.test(t);
}

// ── Format pattern definitions ──────────────────────────────────

interface FormatPattern {
  type: FormatType;
  patterns: RegExp[];
}

const FORMAT_PATTERNS: FormatPattern[] = [
  {
    type: 'AMRAP',
    patterns: [/\bAMRAP\b/i, /\bO MÁXIMO DE\b/i, /\bMAX REPS\b/i, /\bAS MANY\b/i],
  },
  {
    type: 'NOT_FOR_TIME',
    patterns: [/\bNOT\s+FOR\s+TIME\b/i, /\bNFT\b/i, /\bSEM TEMPO\b/i],
  },
  {
    type: 'FOR_TIME',
    patterns: [/\bFOR\s+TIME\b/i, /\bPOR TEMPO\b/i, /\bPELO TEMPO\b/i, /\bCRON[OÔ]METRO\b/i],
  },
  {
    type: 'EMOM',
    patterns: [/\bE\d*MOM\b/i, /\bA CADA\b/i, /\bEVERY\s+\d+/i],
  },
  {
    type: 'CIRCUITO',
    patterns: [/\bCIRCUITO\b/i, /\bROUND ROBIN\b/i, /\bESTA[ÇC][OÕ]ES\b/i, /\bCIRCUIT\b/i],
  },
  {
    type: 'INTERVALADO',
    patterns: [/\bINTERVALADO\b/i, /\bTABATA\b/i, /\bREST[\s-]?PAUSE\b/i, /\bINTERVAL\b/i],
  },
  {
    type: 'ROUNDS_FIXOS',
    patterns: [/\b(\d+)\s*ROUNDS?\b/i, /\b(\d+)\s*RODADAS?\b/i],
  },
];

// ── Time cap extraction ─────────────────────────────────────────

const TIME_CAP_RE = /\b(?:TC|TIME\s*CAP|LIMITE)\s*:?\s*(\d+[\s:]?\d*)\s*(?:min|m|'|")?/i;
const ROUNDS_RE = /\b(\d+)\s*(?:rounds?|rodadas?|séries|sets)\b/i;
const MINUTES_RE = /(\d+)\s*(?:min(?:utos?)?|m(?:in)?|')/i;

// ── EMOM interval detection ─────────────────────────────────────

const EMOM_EXPLICIT_RE = /\bE(\d+)MOM\b/i;
const EMOM_NATURAL_RE = /\b(?:A CADA|EVERY)\s+(\d+)\s*(?:min|m|'|minutos?)/i;

function resolveEmomType(line: string): FormatType {
  const explicitMatch = line.match(EMOM_EXPLICIT_RE);
  if (explicitMatch) {
    const interval = parseInt(explicitMatch[1], 10);
    if (interval >= 2 && interval <= 6) {
      return `E${interval}MOM` as FormatType;
    }
    return 'EMOM';
  }

  const naturalMatch = line.match(EMOM_NATURAL_RE);
  if (naturalMatch) {
    const interval = parseInt(naturalMatch[1], 10);
    if (interval >= 2 && interval <= 6) {
      return `E${interval}MOM` as FormatType;
    }
    return 'EMOM';
  }

  return 'EMOM';
}

// ── Main detector ───────────────────────────────────────────────

export function detectFormat(line: string): FormatDetectionResult | null {
  const trimmed = line.trim();

  if (isPerSetIntervalLine(trimmed)) {
    return null;
  }

  for (const fmt of FORMAT_PATTERNS) {
    const matched = fmt.patterns.some((p) => p.test(trimmed));
    if (!matched) continue;

    const result: FormatDetectionResult = {
      formatType: fmt.type,
    };

    // Resolve EMOM subtypes
    if (fmt.type === 'EMOM') {
      result.formatType = resolveEmomType(trimmed);
    }

    // Extract time cap
    const tcMatch = trimmed.match(TIME_CAP_RE);
    if (tcMatch) {
      result.timeCap = tcMatch[1].trim();
    }

    // Extract rounds
    const roundsMatch = trimmed.match(ROUNDS_RE);
    if (roundsMatch) {
      result.rounds = roundsMatch[1];
    }

    // Extract duration for AMRAP/EMOM (e.g., "AMRAP 15'" or "EMOM 10 min")
    if (!result.timeCap && (fmt.type === 'AMRAP' || fmt.type === 'EMOM')) {
      const minMatch = trimmed.match(MINUTES_RE);
      if (minMatch) {
        result.timeCap = minMatch[1];
      }
    }

    return result;
  }

  return null;
}
