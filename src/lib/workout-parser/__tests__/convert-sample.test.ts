import { describe, it, expect } from 'vitest';
import { parseWorkoutText } from '../parser';

describe('sample: converter should parse as expected', () => {
  it('parses provided sample with bi-set partner written as TEXT', () => {
    const text = [
      '*FORÇA | ACESSÓRIOS*',
      '<Shoulder Press>+',
      '4 x 8-10',
      'Dumbbell Shoulder Front Raise',
      '4 x 8-10',
      'descanse 1min30seg entre as séries.',
      '<Dumbbell Bent Over Lateral Raise>',
      '4 x 8-10',
      'https://youtu.be/wQv7huNi-Y4',
      'descanse 1min30seg entre as séries.',
      '',
      '<Strict CTB Pull Ups>',
      '4 x 7-9',
      'A cada 1min30seg por 4sets',
      '',
      '*SKILL GINÁSTICO*',
      '<Ring Swing>',
      '4 x 8-10',
      'A cada 1min20seg por 4sets',
      '',
      '<Ring Muscle Up Transition>',
      '4 x 2',
      'A cada 1min20seg por 4sets',
      '',
      '<Strict Ring Muscle Ups>',
      '4 x 2',
      'A cada 1min30seg por 4sets',
      '',
      '*CONDICIONAMENTO*',
      'For Time:',
      '500m Corrida',
      '35 Goblet Squat #32/24kg',
      '10 Ring Muscle Ups',
      '--',
      '500m Corrida',
      '25 Goblet Squat #32/24kg',
      '5 Ring Muscle Ups',
      '--',
      '500m Corrida',
      '35 Goblet Squat #32/24kg',
      '10 Ring Muscle Ups',
      'Time cap: 22min',
    ].join('\n');

    const result = parseWorkoutText(text);
    expect(result.blocks.length).toBeGreaterThanOrEqual(3);

    const firstBlock = result.blocks[0];
    expect(firstBlock.title).toBe('FORÇA | ACESSÓRIOS');
    expect(firstBlock.exercises.length).toBeGreaterThanOrEqual(4);

    // Bi-set pair: Shoulder Press + Dumbbell Shoulder Front Raise
    const a1 = firstBlock.exercises[0];
    const a2 = firstBlock.exercises[1];
    expect(a1.name).toBe('Shoulder Press');
    expect(a1.type).toBe('bi-set');
    expect(a2.name).toBe('Dumbbell Shoulder Front Raise');
    expect(a2.type).toBe('bi-set');
    expect(a1.biSetLabel).toBe('A1');
    expect(a2.biSetLabel).toBe('A2');
    expect(a1.prescription.sets).toBe('4');
    expect(a1.prescription.reps).toBe('8-10');
    // Second partner has its own prescription lines in the sample
    expect(a2.prescription.sets).toBe('4');
    expect(a2.prescription.reps).toBe('8-10');

    // Conditioning block
    const cond = result.blocks.find(b => b.title.toUpperCase().includes('CONDICIONAMENTO'));
    expect(cond).toBeTruthy();
    expect(cond!.formatType).toBe('FOR_TIME');
    expect(cond!.timeCap).toBe('22');
  });
});

