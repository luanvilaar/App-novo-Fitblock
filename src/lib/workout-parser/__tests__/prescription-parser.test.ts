import { describe, it, expect } from 'vitest';
import { parsePrescriptionLine, mergePrescription } from '../prescription-parser';

describe('parsePrescriptionLine', () => {
  // ── Sets x Reps ─────────────────────────────────────────────
  describe('sets/reps', () => {
    it('parses 4x10', () => {
      const result = parsePrescriptionLine('4x10');
      expect(result.sets).toBe('4');
      expect(result.reps).toBe('10');
    });

    it('parses 4 x 10', () => {
      const result = parsePrescriptionLine('4 x 10');
      expect(result.sets).toBe('4');
      expect(result.reps).toBe('10');
    });

    it('parses 4X10 (uppercase)', () => {
      const result = parsePrescriptionLine('4X10');
      expect(result.sets).toBe('4');
      expect(result.reps).toBe('10');
    });

    it('parses 4x10-12 (rep range)', () => {
      const result = parsePrescriptionLine('4x10-12');
      expect(result.sets).toBe('4');
      expect(result.reps).toBe('10-12');
    });

    it('parses 5 x 3', () => {
      const result = parsePrescriptionLine('5 x 3');
      expect(result.sets).toBe('5');
      expect(result.reps).toBe('3');
    });
  });

  // ── Pyramid ─────────────────────────────────────────────────
  describe('pyramid', () => {
    it('parses 21-15-9', () => {
      const result = parsePrescriptionLine('21-15-9');
      expect(result.reps).toBe('21-15-9');
      expect(result.sets).toBeUndefined();
    });

    it('parses 10-8-6-4-2', () => {
      const result = parsePrescriptionLine('10-8-6-4-2');
      expect(result.reps).toBe('10-8-6-4-2');
    });
  });

  // ── Load ────────────────────────────────────────────────────
  describe('load', () => {
    it('parses 60kg', () => {
      const result = parsePrescriptionLine('60kg');
      expect(result.load).toBe('60kg');
    });

    it('parses 135lbs', () => {
      const result = parsePrescriptionLine('135lbs');
      expect(result.load).toBe('135lbs');
    });

    it('parses 135lb (singular)', () => {
      const result = parsePrescriptionLine('135lb');
      expect(result.load).toBe('135lb');
    });

    it('parses 70%', () => {
      const result = parsePrescriptionLine('70%');
      expect(result.load).toBe('70%');
    });

    it('parses 60.5kg (decimal)', () => {
      const result = parsePrescriptionLine('60.5kg');
      expect(result.load).toBe('60.5kg');
    });
  });

  // ── Time/Interval ──────────────────────────────────────────
  describe('time/interval', () => {
    it('parses 90s as interval', () => {
      const result = parsePrescriptionLine('90s');
      expect(result.interval).toBe('90s');
    });

    it('parses 30seg', () => {
      const result = parsePrescriptionLine('30seg');
      expect(result.interval).toBe('30seg');
    });

    it('parses 2min as duration', () => {
      const result = parsePrescriptionLine('2min');
      expect(result.duration).toBe('2min');
    });

    it('parses 1:30 as interval', () => {
      const result = parsePrescriptionLine('1:30');
      expect(result.interval).toBe('1:30');
    });

    it('parses "intervalo 60s"', () => {
      const result = parsePrescriptionLine('intervalo 60s');
      expect(result.interval).toBe('intervalo 60s');
    });

    it('parses "descanso 90s"', () => {
      const result = parsePrescriptionLine('descanso 90s');
      expect(result.interval).toBe('descanso 90s');
    });
  });

  // ── Distance ───────────────────────────────────────────────
  describe('distance', () => {
    it('parses 500m', () => {
      const result = parsePrescriptionLine('500m');
      expect(result.distance).toBe('500m');
    });

    it('parses 1km', () => {
      const result = parsePrescriptionLine('1km');
      expect(result.distance).toBe('1km');
    });

    it('parses 2000metros', () => {
      const result = parsePrescriptionLine('2000metros');
      expect(result.distance).toBe('2000metros');
    });
  });

  // ── Reps only ──────────────────────────────────────────────
  describe('reps only', () => {
    it('parses "10 reps"', () => {
      const result = parsePrescriptionLine('10 reps');
      expect(result.reps).toBe('10');
    });

    it('parses "15 repetições"', () => {
      const result = parsePrescriptionLine('15 repetições');
      expect(result.reps).toBe('15');
    });
  });

  // ── Notes fallback ─────────────────────────────────────────
  describe('notes fallback', () => {
    it('treats unknown text as notes', () => {
      const result = parsePrescriptionLine('Fazer com controle excêntrico');
      expect(result.notes).toBe('Fazer com controle excêntrico');
    });
  });
});

describe('mergePrescription', () => {
  it('merges two prescriptions', () => {
    const base = { sets: '4', reps: '10' };
    const addition = { load: '60kg' };
    const merged = mergePrescription(base, addition);
    expect(merged.sets).toBe('4');
    expect(merged.reps).toBe('10');
    expect(merged.load).toBe('60kg');
  });

  it('concatenates notes', () => {
    const base = { notes: 'lento' };
    const addition = { notes: 'controlado' };
    const merged = mergePrescription(base, addition);
    expect(merged.notes).toBe('lento controlado');
  });
});
