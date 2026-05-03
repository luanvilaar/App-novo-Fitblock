import { describe, expect, it } from 'vitest';
import { parseWorkoutText } from '@/lib/workoutParser';
import {
  expandRepsScheme,
  parsedWorkoutToWorkoutItems,
  type ExerciseCatalogEntry,
} from './parsed-to-workout-items';

describe('expandRepsScheme', () => {
  it('faixa 12-15 com 4 séries → base 15 e grelha homogénea', () => {
    const r = expandRepsScheme(4, '12-15');
    expect(r.repsSummary).toBe('15');
    expect(r.reps_scheme).toEqual(['15', '15', '15', '15']);
    expect(r.rangeForNotes).toBe('12-15');
  });

  it('pirâmide 21-15-9 com 3 séries', () => {
    const r = expandRepsScheme(3, '21-15-9');
    expect(r.repsSummary).toBe('21-15-9');
    expect(r.reps_scheme).toEqual(['21', '15', '9']);
    expect(r.rangeForNotes).toBeNull();
  });
});

describe('parsedWorkoutToWorkoutItems', () => {
  it('Hollow Rocks + 4x12-15 + intervalo nas notas', () => {
    const text = ['<Hollow Rocks>', '4 x 12-15', 'A cada 1min10seg por 4sets'].join('\n');
    const parsed = parseWorkoutText(text);
    const catalog: ExerciseCatalogEntry[] = [
      { id: 'ex-1', name: 'Hollow Rocks', video_url: null },
    ];
    const { items, missingCatalogCount } = parsedWorkoutToWorkoutItems(parsed, catalog);

    expect(missingCatalogCount).toBe(0);
    expect(items).toHaveLength(1);
    const row = items[0];
    expect(row.type).toBe('exercise');
    if (row.type !== 'exercise') return;

    expect(row.sets).toBe(4);
    expect(row.reps).toBe('15');
    expect(row.reps_scheme).toEqual(['15', '15', '15', '15']);
    expect(row.exercise_id).toBe('ex-1');
    expect(row.parsed_name).toBe('Hollow Rocks');
    expect(row.notes).toContain('Faixa alvo: 12-15');
    expect(row.notes.toLowerCase()).toContain('a cada 1min10seg');
  });

  it('CONDICIONAMENTO: intervalo no bloco, snatch 20 reps, handstand 2x6m, tipo INTERVALADO', () => {
    const text = [
      '*CONDICIONAMENTO*',
      'A cada 3min30seg por 5sets',
      '15 CTB Pull Ups',
      '20 Dumbbell Snatch #22,5/15kg',
      '2 x 6m Handstand Walk #unbk',
    ].join('\n');
    const parsed = parseWorkoutText(text);
    const catalog: ExerciseCatalogEntry[] = [];
    const { items } = parsedWorkoutToWorkoutItems(parsed, catalog);

    expect(items).toHaveLength(1);
    const m = items[0];
    expect(m.type).toBe('metcon');
    if (m.type !== 'metcon') return;
    expect(m.metcon_type).toBe('INTERVALADO');
    expect(parsed.blocks[0].rounds).toBe('5');
    const desc = m.metcon_description;
    expect(desc).toContain('A cada 3min30seg por 5sets');
    expect(desc).toContain('15');
    expect(desc).toContain('20');
    expect(desc).toMatch(/2\s*x\s*6m/i);
    expect(desc).toMatch(/Handstand\s+Walk/i);
    expect(desc).not.toMatch(/^\s*6\s+CTB/m);
  });

  it('três exercícios com intervalo: notas preservadas mesmo sem catálogo', () => {
    const text = [
      '<Hollow Rocks>',
      '4 x 12-15',
      'A cada 1min10seg por 4sets',
      '',
      '<V-Ups + Tucks>',
      '3 x 10-12',
      'A cada 1min20seg por 3sets',
      '',
      '<Side V-Ups>',
      '3 x 8-10',
      'A cada 1min20seg por 3sets',
    ].join('\n');
    const parsed = parseWorkoutText(text);
    const { items } = parsedWorkoutToWorkoutItems(parsed, []);
    expect(items).toHaveLength(3);
    for (const row of items) {
      expect(row.type).toBe('exercise');
      if (row.type !== 'exercise') continue;
      expect(row.notes.toLowerCase()).toMatch(/a cada/);
      expect(row.parsed_name.length).toBeGreaterThan(2);
    }
    expect(items[0].type === 'exercise' && items[0].sets).toBe(4);
    expect(items[1].type === 'exercise' && items[1].sets).toBe(3);
  });

  it('nome com sufixo alinha ao catálogo (back squat costas → back squat)', () => {
    const text = ['<back squat costas>', '4 x 8-10'].join('\n');
    const parsed = parseWorkoutText(text);
    const catalog: ExerciseCatalogEntry[] = [
      { id: 'bs-1', name: 'back squat', video_url: 'https://example.com/v' },
    ];
    const { items, missingCatalogCount } = parsedWorkoutToWorkoutItems(parsed, catalog);
    expect(missingCatalogCount).toBe(0);
    expect(items).toHaveLength(1);
    const row = items[0];
    expect(row.type).toBe('exercise');
    if (row.type !== 'exercise') {
      return;
    }
    expect(row.exercise_id).toBe('bs-1');
    expect(row.parsed_name).toBe('back squat costas');
    expect(row.video_url).toBe('https://example.com/v');
  });
});
