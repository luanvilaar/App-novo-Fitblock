import { describe, it, expect } from 'vitest';
import { parseWorkoutText } from '../../workoutParser';
import type { ParsedWorkout } from '../../workoutParser';

/**
 * Backward-compatibility tests.
 * Verify that the adapter layer in workoutParser.ts produces the same
 * legacy interface shape expected by all existing consumers.
 */
describe('backward-compatible adapter', () => {
  it('returns legacy interface shape', () => {
    const text = '*FORÇA*\n-Bench Press-\n4x10\n60kg';
    const result: ParsedWorkout = parseWorkoutText(text);

    // Should have flat fields, not nested prescription
    const ex = result.blocks[0].exercises[0];
    expect(ex.name).toBe('Bench Press');
    expect(ex.sets).toBe('4');
    expect(ex.reps).toBe('10');
    expect(ex.load).toBe('60kg');
    expect(typeof ex.isBiSet).toBe('boolean');
    expect(typeof ex.isCombined).toBe('boolean');
    expect(ex.isBiSet).toBe(false);
    expect(ex.isCombined).toBe(false);

    // Should NOT have a 'prescription' field
    expect((ex as unknown as Record<string, unknown>).prescription).toBeUndefined();
  });

  it('maps bi-set correctly', () => {
    const text = '-Bench Press-+\n4x10\n-Triceps Rope-\n4x10';
    const result = parseWorkoutText(text);

    expect(result.blocks[0].exercises[0].isBiSet).toBe(true);
    expect(result.blocks[0].exercises[1].isBiSet).toBe(true);
  });

  it('maps combined correctly', () => {
    const text = '-V-Ups + Tucks-\n3x12';
    const result = parseWorkoutText(text);

    expect(result.blocks[0].exercises[0].isCombined).toBe(true);
    expect(result.blocks[0].exercises[0].isBiSet).toBe(false);
  });

  it('maps block formatType as string', () => {
    const text = "*METCON*\nAMRAP 15'";
    const result = parseWorkoutText(text);

    expect(result.blocks[0].formatType).toBe('AMRAP');
    expect(typeof result.blocks[0].formatType).toBe('string');
  });

  it('maps timeCap and rounds', () => {
    const text = "*METCON*\nAMRAP 15'\n5 Rounds";
    const result = parseWorkoutText(text);

    expect(result.blocks[0].timeCap).toBe('15');
  });

  it('maps globalNotes', () => {
    const text = '*FORÇA*\n------\nScore: max load';
    const result = parseWorkoutText(text);

    expect(result.globalNotes).toContain('Score: max load');
  });

  it('handles interval/duration in notes field (legacy flattening)', () => {
    const text = '*FORÇA*\n-Bench Press-\n4x10\n90s';
    const result = parseWorkoutText(text);

    // In legacy interface, interval/duration go into `notes` field
    const ex = result.blocks[0].exercises[0];
    expect(ex.notes).toBeDefined();
    expect(ex.notes).toContain('90s');
  });

  it('handles empty input', () => {
    const result = parseWorkoutText('');
    expect(result.blocks).toHaveLength(0);
    expect(result.globalNotes).toBeUndefined();
  });

  it('handles real-world workout text', () => {
    const text = [
      '*AQUECIMENTO*',
      '10 Jumping Jacks',
      '10 Air Squats',
      '',
      '*FORÇA*',
      '-Back Squat-',
      '5x5',
      '80kg',
      '',
      '*METCON*',
      'For Time',
      '-Thrusters-',
      '21-15-9',
      '-Pull Ups-',
      '21-15-9',
      '------',
      'TC 20 min',
    ].join('\n');

    const result = parseWorkoutText(text);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0].title).toBe('AQUECIMENTO');
    expect(result.blocks[1].title).toBe('FORÇA');
    expect(result.blocks[2].title).toBe('METCON');
    expect(result.blocks[2].formatType).toBe('FOR_TIME');
    expect(result.globalNotes).toBeDefined();
  });
});
