import { describe, expect, it } from 'vitest';
import { parseWorkoutText } from '@/lib/workoutParser';
import { aggregateConditioningBlock, aggregateWeeklyConditioningVolume } from '../aggregate';

describe('aggregateConditioningBlock', () => {
  it('EMOM 6 min × 4 rounds: soma reps por movimento no round e multiplica', () => {
    const text = [
      'CONDICIONAMENTO',
      'A cada 6minutos por 4 Rounds',
      '4 Wall Walk',
      '16 Kettlebell Snatch #24/16kg',
      '3 Wall Walk',
      '12 Kettlebell Snatch #24/16kg',
      '300m Remo',
      '12 Strict Handstand Push Ups',
      '------',
      'notas',
    ].join('\n');

    const parsed = parseWorkoutText(text);
    const block = parsed.blocks.find((b) => b.title.toUpperCase().includes('CONDICIONAMENTO'));
    expect(block).toBeDefined();
    const map = aggregateConditioningBlock(block!);
    const byLabel = Object.fromEntries([...map.entries()].map(([k, v]) => [v.label, v.total]));

    expect(byLabel['Wall Walk']).toBe(28);
    expect(byLabel['Kettlebell Snatch #24/16kg']).toBe(112);
    expect(byLabel['Remo']).toBe(1200);
    expect(byLabel['Strict Handstand Push Ups']).toBe(48);
  });
});

describe('aggregateWeeklyConditioningVolume', () => {
  it('soma dois treinos na semana', () => {
    const w1 = [
      'CONDICIONAMENTO',
      'A cada 6minutos por 4 Rounds',
      '4 Wall Walk',
      '300m Remo',
    ].join('\n');

    const w2 = [
      '*METCON*',
      'AMRAP 12',
      '200 Double Under',
    ].join('\n');

    const rows = aggregateWeeklyConditioningVolume([{ description: w1 }, { description: w2 }]);
    const wall = rows.find((r) => r.label === 'Wall Walk');
    const row = rows.find((r) => r.label === 'Remo');
    const du = rows.find((r) => r.label.includes('Double'));

    expect(wall?.total).toBe(16);
    expect(row?.total).toBe(1200);
    expect(du?.total).toBe(200);
  });
});
