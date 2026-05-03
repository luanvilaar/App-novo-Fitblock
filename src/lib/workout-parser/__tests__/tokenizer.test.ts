import { describe, it, expect } from 'vitest';
import { tokenizeLine, tokenize } from '../tokenizer';

describe('tokenizeLine', () => {
  // ── Block Headers ───────────────────────────────────────────
  describe('BLOCK_HEADER', () => {
    it('detects *TITLE* format', () => {
      const token = tokenizeLine('*FORÇA*', 1);
      expect(token.type).toBe('BLOCK_HEADER');
      expect(token.value.title).toBe('FORÇA');
    });

    it('detects *AQUECIMENTO* format', () => {
      const token = tokenizeLine('*AQUECIMENTO*', 1);
      expect(token.type).toBe('BLOCK_HEADER');
      expect(token.value.title).toBe('AQUECIMENTO');
    });

    it('detects UPPERCASE text as block header', () => {
      const token = tokenizeLine('CONDICIONAMENTO', 1);
      expect(token.type).toBe('BLOCK_HEADER');
      expect(token.value.title).toBe('CONDICIONAMENTO');
    });

    it('detects ENDURANCE as block header', () => {
      const token = tokenizeLine('ENDURANCE', 1);
      expect(token.type).toBe('BLOCK_HEADER');
    });

    it('does not treat short uppercase as block (< 3 chars)', () => {
      const token = tokenizeLine('OK', 1);
      expect(token.type).not.toBe('BLOCK_HEADER');
    });
  });

  // ── Exercises ─────────────────────────────────────────────────
  describe('EXERCISE', () => {
    it('detects -Name- format', () => {
      const token = tokenizeLine('-Bench Press-', 1);
      expect(token.type).toBe('EXERCISE');
      expect(token.value.name).toBe('Bench Press');
    });

    it('detects -Hollow Rocks-', () => {
      const token = tokenizeLine('-Hollow Rocks-', 1);
      expect(token.type).toBe('EXERCISE');
      expect(token.value.name).toBe('Hollow Rocks');
    });

    it('detects exercise with spaces', () => {
      const token = tokenizeLine('-Romanian Deadlift-', 1);
      expect(token.type).toBe('EXERCISE');
      expect(token.value.name).toBe('Romanian Deadlift');
    });
  });

  // ── Bi-set ────────────────────────────────────────────────────
  describe('EXERCISE_BISET', () => {
    it('detects -Name-+ format', () => {
      const token = tokenizeLine('-Bench Press-+', 1);
      expect(token.type).toBe('EXERCISE_BISET');
      expect(token.value.name).toBe('Bench Press');
    });

    it('detects with trailing space', () => {
      const token = tokenizeLine('-Triceps Rope-+ ', 1);
      expect(token.type).toBe('EXERCISE_BISET');
      expect(token.value.name).toBe('Triceps Rope');
    });
  });

  // ── Combined Exercise ─────────────────────────────────────────
  describe('EXERCISE_COMBINED', () => {
    it('detects -A + B- format', () => {
      const token = tokenizeLine('-V-Ups + Tucks-', 1);
      expect(token.type).toBe('EXERCISE_COMBINED');
      expect(token.value.name).toBe('V-Ups + Tucks');
    });

    it('detects -Clean + Jerk-', () => {
      const token = tokenizeLine('-Clean + Jerk-', 1);
      expect(token.type).toBe('EXERCISE_COMBINED');
      expect(token.value.name).toBe('Clean + Jerk');
    });
  });

  // ── Separator ─────────────────────────────────────────────────
  describe('SEPARATOR', () => {
    it('detects ------', () => {
      const token = tokenizeLine('------', 1);
      expect(token.type).toBe('SEPARATOR');
    });

    it('detects ---', () => {
      const token = tokenizeLine('---', 1);
      expect(token.type).toBe('SEPARATOR');
    });

    it('detects long separator', () => {
      const token = tokenizeLine('----------', 1);
      expect(token.type).toBe('SEPARATOR');
    });
  });

  // ── Format Indicators ─────────────────────────────────────────
  describe('FORMAT_INDICATOR', () => {
    it('detects AMRAP', () => {
      const token = tokenizeLine("AMRAP 15'", 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
      expect(token.value.format).toBe('AMRAP');
    });

    it('detects For Time', () => {
      const token = tokenizeLine('For Time', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
      expect(token.value.format).toBe('FOR_TIME');
    });

    it('detects EMOM', () => {
      const token = tokenizeLine('EMOM 10 min', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
      expect(token.value.format).toBe('EMOM');
    });

    it('detects E2MOM', () => {
      const token = tokenizeLine('E2MOM', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
    });

    it('detects Not For Time', () => {
      const token = tokenizeLine('Not For Time', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
      expect(token.value.format).toBe('NOT_FOR_TIME');
    });

    it('detects Circuito', () => {
      const token = tokenizeLine('Circuito', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
      expect(token.value.format).toBe('CIRCUITO');
    });

    it('detects 3 Rounds', () => {
      const token = tokenizeLine('3 Rounds', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
      expect(token.value.format).toBe('ROUNDS_FIXOS');
    });

    it('detects A cada 2 minutos', () => {
      const token = tokenizeLine('A cada 2 minutos', 1);
      expect(token.type).toBe('FORMAT_INDICATOR');
    });

    it('does not treat per-set interval as block EMOM format', () => {
      const token = tokenizeLine('A cada 1min30seg por 5sets', 1);
      expect(token.type).toBe('PRESCRIPTION');
      expect(token.value.text).toBe('A cada 1min30seg por 5sets');
    });
  });

  // ── Prescription ──────────────────────────────────────────────
  describe('PRESCRIPTION', () => {
    it('detects 4x10', () => {
      const token = tokenizeLine('4x10', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 4 x 10-12', () => {
      const token = tokenizeLine('4 x 10-12', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 60kg', () => {
      const token = tokenizeLine('60kg', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 70%', () => {
      const token = tokenizeLine('70%', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 90s', () => {
      const token = tokenizeLine('90s', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 1min', () => {
      const token = tokenizeLine('1min', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 21-15-9 pyramid', () => {
      const token = tokenizeLine('21-15-9', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('detects 500m distance', () => {
      const token = tokenizeLine('500m', 1);
      expect(token.type).toBe('PRESCRIPTION');
    });

    it('does not treat 2 x 6m + exercise as pure prescription', () => {
      const token = tokenizeLine('2 x 6m Handstand Walk #unbk', 1);
      expect(token.type).toBe('TEXT');
    });
  });

  // ── Empty & Text ──────────────────────────────────────────────
  describe('EMPTY and TEXT', () => {
    it('detects empty line', () => {
      const token = tokenizeLine('', 1);
      expect(token.type).toBe('EMPTY');
    });

    it('detects whitespace-only as empty', () => {
      const token = tokenizeLine('   ', 1);
      expect(token.type).toBe('EMPTY');
    });

    it('falls back to TEXT for generic text', () => {
      const token = tokenizeLine('Fazer com controle', 1);
      expect(token.type).toBe('TEXT');
    });
  });
});

describe('tokenize', () => {
  it('tokenizes multi-line text', () => {
    const text = '*FORÇA*\n-Bench Press-\n4x10\n60kg';
    const tokens = tokenize(text);
    expect(tokens).toHaveLength(4);
    expect(tokens[0].type).toBe('BLOCK_HEADER');
    expect(tokens[1].type).toBe('EXERCISE');
    expect(tokens[2].type).toBe('PRESCRIPTION');
    expect(tokens[3].type).toBe('PRESCRIPTION');
  });

  it('preserves line numbers (1-indexed)', () => {
    const text = '*A*\n\n-B-';
    const tokens = tokenize(text);
    expect(tokens[0].line).toBe(1);
    expect(tokens[1].line).toBe(2); // empty line
    expect(tokens[2].line).toBe(3);
  });
});
