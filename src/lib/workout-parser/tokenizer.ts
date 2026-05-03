import type { Token, TokenType } from './types';
import { isNaturalEmomLine, isPerSetIntervalLine } from './format-detector';

// ── Regex patterns (ordered by priority) ────────────────────────

const SEPARATOR_RE = /^-{2,}$/;  // 2+ dashes (-- for rounds, --- for notes)
const BLOCK_HEADER_ASTERISK_RE = /^\*(.+)\*$/;

// Hyphen syntax: -Name-, -Name-+, -A + B-
const EXERCISE_BISET_RE = /^-(.+)-\+\s*$/;
const EXERCISE_COMBINED_RE = /^-(.+\+.+)-\s*$/;
const EXERCISE_CLOSED_RE = /^-(.+)-\s*$/;
const EXERCISE_OPEN_RE = /^-([^-].{2,})$/;

// Angle bracket syntax: <Name>, <Name>+, <A + B>
const EXERCISE_ANGLE_BISET_RE = /^<(.+)>\+\s*$/;
const EXERCISE_ANGLE_COMBINED_RE = /^<(.+\+.+)>\s*$/;
const EXERCISE_ANGLE_RE = /^<(.+)>\s*$/;

// URL pattern (YouTube, etc.)
const URL_RE = /^https?:\/\//i;

const SETS_REPS_RE = /^(\d+)\s*x\s*(\d+[\d\-\/]*)/i;
const PYRAMID_REPS_RE = /^(\d+-){1,}\d+$/;
const LOAD_ONLY_RE = /^\d+[\.,]?\d*\s*(kg|lbs?|%)\s*$/i;  // ONLY load, nothing else
const TIME_ONLY_RE = /^\d+\s*(min|seg|s(?:eg)?|m(?:in)?|'|")\s*$/i;  // ONLY time
const TIME_COLON_RE = /^\d{1,2}:\d{2}(:\d{2})?\s*$/;  // 1:30, 2:00:00
const DISTANCE_ONLY_RE = /^\d+[\.,]?\d*\s*(m|km|mi|metros?|miles?)\s*$/i;  // ONLY distance
const REPS_ONLY_RE = /^\d+\s*(reps?|repetições?)\s*$/i;

// ── Time cap / meta line detection ──────────────────────────────

const TIME_CAP_LINE_RE = /^(?:time\s*cap|tc|limite)\s*:?\s*(.+)/i;

// ── Inline exercise patterns ────────────────────────────────────

// "10 Burpees", "35 Goblet Squat #32/24kg" — number + text with at least one letter
const INLINE_EXERCISE_NUM_RE = /^(\d+)\s+([a-zA-ZÀ-ÿ].{2,})$/;

// "500m Corrida", "1km Run" — distance + exercise name
const INLINE_EXERCISE_DIST_RE = /^(\d+\s*(?:m|km|mi(?:les?)?))\s+([a-zA-ZÀ-ÿ].{2,})$/i;

// ── Interval / rest keywords ────────────────────────────────────

const INTERVAL_LINE_RE = /^(?:intervalo|descanso|descanse|rest|pausa)\b/i;

// ── Format indicator patterns ───────────────────────────────────

const FORMAT_PATTERNS: Array<{ key: string; patterns: RegExp[] }> = [
  { key: 'AMRAP', patterns: [/\bAMRAP\b/i, /\bO MÁXIMO DE\b/i, /\bMAX REPS\b/i, /\bAS MANY\b/i] },
  { key: 'NOT_FOR_TIME', patterns: [/\bNOT\s+FOR\s+TIME\b/i, /\bNFT\b/i, /\bSEM TEMPO\b/i] },
  { key: 'FOR_TIME', patterns: [/\bFOR\s+TIME\b/i, /\bPOR TEMPO\b/i, /\bPELO TEMPO\b/i, /\bCRON[OÔ]METRO\b/i] },
  { key: 'EMOM', patterns: [/\bE\d*MOM\b/i, /\bEMOM\b/i, /\bEVERY\s+\d+\s*(?:minutos?|mins?|m|'|segundos?|segs?|s(?:ec)?|")/i] },
  { key: 'CIRCUITO', patterns: [/\bCIRCUITO\b/i, /\bROUND ROBIN\b/i, /\bESTA[ÇC][OÕ]ES\b/i, /\bCIRCUIT\b/i] },
  { key: 'INTERVALADO', patterns: [/\bINTERVALADO\b/i, /\bTABATA\b/i, /\bREST[\s-]?PAUSE\b/i] },
  { key: 'ROUNDS_FIXOS', patterns: [/\b(\d+)\s*ROUNDS?\b/i, /\b(\d+)\s*RODADAS?\b/i] },
];

function isUpperCaseBlockHeader(line: string): boolean {
  if (line.length < 3) return false;
  if (line.startsWith('-')) return false;
  if (/^\d/.test(line)) return false;
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (letters.length < 2) return false;
  return letters === letters.toUpperCase();
}

function matchFormatIndicator(line: string): { key: string } | null {
  if (isPerSetIntervalLine(line)) return null;
  if (/\bA\s+CADA\b/i.test(line) && !isNaturalEmomLine(line)) return null;
  if (isNaturalEmomLine(line)) return { key: 'EMOM' };
  for (const fmt of FORMAT_PATTERNS) {
    for (const pattern of fmt.patterns) {
      if (pattern.test(line)) {
        return { key: fmt.key };
      }
    }
  }
  return null;
}

/**
 * Check if a line is a pure prescription (no exercise name mixed in).
 * Lines like "500m Corrida" or "35 Goblet Squat" are NOT prescriptions —
 * they're inline exercises that happen to start with a number/distance.
 */
function isPrescriptionLine(line: string): boolean {
  // "2 x 6m Handstand Walk" — não tratar como prescrição pura (evita fundir "2 x 6" no exercício anterior)
  if (/^\d+\s*x\s*\d+[\.,]?\d*\s*(m|km)\s+[a-zA-ZÀ-ÿ]/i.test(line)) {
    return false;
  }

  // Prescription patterns take priority (exact structural matches)
  if (SETS_REPS_RE.test(line)) return true;       // 4x10, 4 x 10-12
  if (PYRAMID_REPS_RE.test(line)) return true;    // 21-15-9
  if (LOAD_ONLY_RE.test(line)) return true;       // 60kg, 135lbs, 70%
  if (TIME_ONLY_RE.test(line)) return true;       // 90s, 2min
  if (TIME_COLON_RE.test(line)) return true;      // 1:30
  if (DISTANCE_ONLY_RE.test(line)) return true;   // 500m (alone, no name)
  if (REPS_ONLY_RE.test(line)) return true;       // 10 reps
  if (INTERVAL_LINE_RE.test(line)) return true;   // "descanse 1min30seg..."
  if (URL_RE.test(line)) return true;             // https://youtu.be/...

  // If none of the pure prescription patterns match,
  // inline exercise patterns would catch it as TEXT (which is fine)
  return false;
}

// ── Tokenizer ───────────────────────────────────────────────────

export function tokenizeLine(raw: string, lineNumber: number): Token {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { type: 'EMPTY', raw, line: lineNumber, value: {} };
  }

  // 1. Separator (-- for rounds, --- for notes)
  if (SEPARATOR_RE.test(trimmed)) {
    return {
      type: 'SEPARATOR',
      raw,
      line: lineNumber,
      value: { dashes: String(trimmed.length) },
    };
  }

  // 2. Block header (*TITLE*)
  const asteriskMatch = trimmed.match(BLOCK_HEADER_ASTERISK_RE);
  if (asteriskMatch) {
    return {
      type: 'BLOCK_HEADER',
      raw,
      line: lineNumber,
      value: { title: asteriskMatch[1].trim() },
    };
  }

  // 3. Exercise bi-set: -Name-+ or <Name>+
  const bisetMatch = trimmed.match(EXERCISE_BISET_RE) || trimmed.match(EXERCISE_ANGLE_BISET_RE);
  if (bisetMatch) {
    return {
      type: 'EXERCISE_BISET',
      raw,
      line: lineNumber,
      value: { name: bisetMatch[1].trim() },
    };
  }

  // 4. Combined exercise: -A + B- or <A + B>
  const combinedMatch = trimmed.match(EXERCISE_COMBINED_RE) || trimmed.match(EXERCISE_ANGLE_COMBINED_RE);
  if (combinedMatch) {
    return {
      type: 'EXERCISE_COMBINED',
      raw,
      line: lineNumber,
      value: { name: combinedMatch[1].trim() },
    };
  }

  // 5. Exercise simple: -Name- or <Name>
  const closedMatch = trimmed.match(EXERCISE_CLOSED_RE) || trimmed.match(EXERCISE_ANGLE_RE);
  if (closedMatch) {
    return {
      type: 'EXERCISE',
      raw,
      line: lineNumber,
      value: { name: closedMatch[1].trim() },
    };
  }

  // 5b. Exercise open format (-Name without closing dash)
  const openMatch = trimmed.match(EXERCISE_OPEN_RE);
  if (openMatch) {
    return {
      type: 'EXERCISE',
      raw,
      line: lineNumber,
      value: { name: openMatch[1].trim() },
    };
  }

  // 6. Time cap / meta line ("Time cap: 22min", "TC: 15'")
  const tcMatch = trimmed.match(TIME_CAP_LINE_RE);
  if (tcMatch) {
    return {
      type: 'FORMAT_INDICATOR',
      raw,
      line: lineNumber,
      value: { format: 'TIME_CAP', text: trimmed, timeCap: tcMatch[1].trim() },
    };
  }

  // 6b. Intervalo por série — prescrição (para merge no exercício / notas de bloco)
  if (isPerSetIntervalLine(trimmed)) {
    return {
      type: 'PRESCRIPTION',
      raw,
      line: lineNumber,
      value: { text: trimmed },
    };
  }

  // 7. Format indicator (AMRAP, EMOM, FOR TIME, etc.)
  const fmtMatch = matchFormatIndicator(trimmed);
  if (fmtMatch) {
    return {
      type: 'FORMAT_INDICATOR',
      raw,
      line: lineNumber,
      value: { format: fmtMatch.key, text: trimmed },
    };
  }

  // 8. Block header (UPPERCASE without dash)
  if (isUpperCaseBlockHeader(trimmed)) {
    return {
      type: 'BLOCK_HEADER',
      raw,
      line: lineNumber,
      value: { title: trimmed },
    };
  }

  // 9. Prescription line (ONLY pure prescriptions — no exercise names)
  if (isPrescriptionLine(trimmed)) {
    return {
      type: 'PRESCRIPTION',
      raw,
      line: lineNumber,
      value: { text: trimmed },
    };
  }

  // 10. Fallback: TEXT
  return { type: 'TEXT', raw, line: lineNumber, value: { text: trimmed } };
}

export function tokenize(text: string): Token[] {
  const lines = text.split('\n');
  return lines.map((line, index) => tokenizeLine(line, index + 1));
}
