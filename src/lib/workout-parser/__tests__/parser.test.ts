import { describe, it, expect } from 'vitest';
import { parseWorkoutText } from '../parser';

describe('parseWorkoutText', () => {
  // ── Block parsing ───────────────────────────────────────────
  describe('blocks', () => {
    it('parses a single block with *TITLE*', () => {
      const result = parseWorkoutText('*FORÇA*');
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].title).toBe('FORÇA');
      expect(result.blocks[0].category).toBe('FORÇA');
    });

    it('parses multiple blocks', () => {
      const result = parseWorkoutText('*AQUECIMENTO*\n\n*FORÇA*\n\n*METCON*');
      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[0].title).toBe('AQUECIMENTO');
      expect(result.blocks[1].title).toBe('FORÇA');
      expect(result.blocks[2].title).toBe('METCON');
    });

    it('creates default "Geral" block when no header', () => {
      const result = parseWorkoutText('-Bench Press-\n4x10');
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].title).toBe('Geral');
    });

    it('parses UPPERCASE block headers', () => {
      const result = parseWorkoutText('CONDICIONAMENTO');
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].title).toBe('CONDICIONAMENTO');
    });
  });

  // ── Exercise parsing ──────────────────────────────────────────
  describe('exercises', () => {
    it('parses a simple exercise with prescription', () => {
      const result = parseWorkoutText('*FORÇA*\n-Bench Press-\n4x10\n60kg');
      const ex = result.blocks[0].exercises[0];
      expect(ex.name).toBe('Bench Press');
      expect(ex.type).toBe('single');
      expect(ex.prescription.sets).toBe('4');
      expect(ex.prescription.reps).toBe('10');
      expect(ex.prescription.load).toBe('60kg');
    });

    it('parses multiple exercises in one block', () => {
      const text = '*FORÇA*\n-Bench Press-\n4x10\n-Squat-\n5x5';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].exercises).toHaveLength(2);
      expect(result.blocks[0].exercises[0].name).toBe('Bench Press');
      expect(result.blocks[0].exercises[1].name).toBe('Squat');
    });
  });

  // ── Bi-set parsing ────────────────────────────────────────────
  describe('bi-set', () => {
    it('parses bi-set pair from spec example', () => {
      const text = '-Bench Press-+\n4 x 10-12\n-Triceps Rope-\n4 x 10-12';
      const result = parseWorkoutText(text);
      const exercises = result.blocks[0].exercises;

      expect(exercises).toHaveLength(2);
      expect(exercises[0].name).toBe('Bench Press');
      expect(exercises[0].type).toBe('bi-set');
      expect(exercises[0].biSetPartner).toBe('Triceps Rope');
      expect(exercises[0].prescription.sets).toBe('4');
      expect(exercises[0].prescription.reps).toBe('10-12');

      expect(exercises[1].name).toBe('Triceps Rope');
      expect(exercises[1].type).toBe('bi-set');
      expect(exercises[1].biSetPartner).toBe('Bench Press');
      expect(exercises[1].prescription.sets).toBe('4');
      expect(exercises[1].prescription.reps).toBe('10-12');
    });

    it('each bi-set exercise maintains its own prescription', () => {
      const text = '-Bench Press-+\n4x10\n-Triceps Rope-\n3x15';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].exercises[0].prescription.sets).toBe('4');
      expect(result.blocks[0].exercises[0].prescription.reps).toBe('10');
      expect(result.blocks[0].exercises[1].prescription.sets).toBe('3');
      expect(result.blocks[0].exercises[1].prescription.reps).toBe('15');
    });
  });

  // ── Combined exercise ─────────────────────────────────────────
  describe('combined', () => {
    it('parses -V-Ups + Tucks- as combined', () => {
      const result = parseWorkoutText('-V-Ups + Tucks-\n3x12');
      const ex = result.blocks[0].exercises[0];
      expect(ex.name).toBe('V-Ups + Tucks');
      expect(ex.type).toBe('combined');
      expect(ex.prescription.sets).toBe('3');
      expect(ex.prescription.reps).toBe('12');
    });

    it('parses -Clean + Jerk- as combined', () => {
      const result = parseWorkoutText('-Clean + Jerk-\n5x1');
      expect(result.blocks[0].exercises[0].type).toBe('combined');
    });
  });

  // ── Conditioning formats ──────────────────────────────────────
  describe('conditioning formats', () => {
    it('parses AMRAP block', () => {
      const text = "*METCON*\nAMRAP 15'\n10 Box Jump\n15 Wall Ball";
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('AMRAP');
      expect(result.blocks[0].timeCap).toBe('15');
    });

    it('parses For Time block', () => {
      const text = '*METCON*\nFor Time\n21-15-9\n-Thrusters-\n-Pull Ups-';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('FOR_TIME');
    });

    it('parses EMOM block', () => {
      const text = '*CONDICIONAMENTO*\nEMOM 10 min\n5 Clean\n10 Push Ups';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('EMOM');
      expect(result.blocks[0].timeCap).toBe('10');
    });

    it('parses E3MOM (dynamic interval)', () => {
      const text = '*METCON*\nE3MOM\n3 Power Clean\n6 Push Ups';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('E3MOM');
    });

    it('parses "A cada 2 minutos" as E2MOM', () => {
      const text = '*METCON*\nA cada 2 minutos\n5 Snatch';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('E2MOM');
    });

    it('parses Not For Time', () => {
      const text = '*METCON*\nNot For Time\n-Farmer Walk-\n100m';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('NOT_FOR_TIME');
    });

    it('parses Circuito', () => {
      const text = '*METCON*\nCircuito\n-Burpees-\n-Sit Ups-';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].formatType).toBe('CIRCUITO');
    });

    it('parses rounds', () => {
      const text = '*METCON*\n5 Rounds\n10 Burpees\n15 Sit Ups';
      const result = parseWorkoutText(text);
      expect(result.blocks[0].rounds).toBe('5');
    });
  });

  // ── Global notes ──────────────────────────────────────────────
  describe('notes', () => {
    it('parses global notes after ------', () => {
      const text = '*FORÇA*\n-Squat-\n5x5\n------\nScore: max load\nTempo: livre';
      const result = parseWorkoutText(text);
      expect(result.globalNotes).toContain('Score: max load');
      expect(result.globalNotes).toContain('Tempo: livre');
    });

    it('notes section captures all text below separator', () => {
      const text = '------\nNota 1\nNota 2\nNota 3';
      const result = parseWorkoutText(text);
      expect(result.globalNotes).toContain('Nota 1');
      expect(result.globalNotes).toContain('Nota 2');
      expect(result.globalNotes).toContain('Nota 3');
    });

    it('long dash line does not send following lines to globalNotes', () => {
      const text = [
        '*CONDICIONAMENTO*',
        '10 Burpees',
        '--------',
        'VERSÃO ALTERNATIVA',
        '5 Burpees',
      ].join('\n');
      const result = parseWorkoutText(text);
      expect(result.globalNotes).toBeUndefined();
      expect(result.blocks[0].notes).toContain('--------');
      // "VERSÃO ALTERNATIVA" em maiúsculas pode abrir novo bloco; o essencial é não perder tudo em globalNotes
      const allBurpees = result.blocks.flatMap((b) => b.exercises).filter((e) => e.name === 'Burpees');
      expect(allBurpees.length).toBe(2);
      expect(allBurpees.map((e) => e.prescription.reps)).toEqual(
        expect.arrayContaining(['10', '5']),
      );
    });
  });

  // ── Inline exercises (number + name) ──────────────────────────
  describe('inline exercises', () => {
    it('parses "10 Burpees" as exercise with reps', () => {
      const text = '*METCON*\nAMRAP 15\n10 Burpees\n15 Wall Ball\n20 Double Under';
      const result = parseWorkoutText(text);
      const exercises = result.blocks[0].exercises;
      expect(exercises.length).toBeGreaterThanOrEqual(3);
      expect(exercises[0].name).toBe('Burpees');
      expect(exercises[0].prescription.reps).toBe('10');
    });

    it('keeps "a cada 8 repetições..." as exercise note instead of block EMOM', () => {
      const text = [
        '<Back Squat>',
        '4 x 6',
        'cargas moderadas e execução explosiva.',
        'descanse 60 a 90 seg entre as séries.',
        '',
        '<Leg Extension Machine>',
        '4 x 24',
        'drop-set',
        'a cada 8 repetições baixe a carga',
        'descanse 60 a 90 seg entre as séries.',
      ].join('\n');

      const result = parseWorkoutText(text);
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].formatType).toBeNull();
      expect(result.blocks[0].exercises).toHaveLength(2);

      const legExtension = result.blocks[0].exercises[1];
      expect(legExtension.name).toBe('Leg Extension Machine');
      expect(legExtension.prescription.sets).toBe('4');
      expect(legExtension.prescription.reps).toBe('24');
      expect(legExtension.prescription.notes?.toLowerCase()).toContain('drop-set');
      expect(legExtension.prescription.notes?.toLowerCase()).toContain('a cada 8 repetições');
      expect(legExtension.prescription.notes?.toLowerCase()).toContain('baixe a carga');
      expect(legExtension.prescription.interval?.toLowerCase()).toContain('descanse 60 a 90 seg');
    });
  });

  // ── Full workout (golden test) ────────────────────────────────
  describe('full workout', () => {
    it('parses a complete real-world workout', () => {
      const text = [
        '*AQUECIMENTO*',
        '3 Rounds',
        '10 Jumping Jacks',
        '10 Air Squats',
        '',
        '*FORÇA*',
        '-Bench Press-+',
        '4 x 10-12',
        '-Triceps Rope-',
        '4 x 10-12',
        '',
        '-Squat-',
        '5x5',
        '80kg',
        '',
        '*METCON*',
        "AMRAP 15'",
        '10 Box Jump',
        '15 Wall Ball',
        '20 Double Under',
        '',
        '------',
        'Score: total rounds + reps',
        'RX: Box 24"/20", WB 20/14lbs',
      ].join('\n');

      const result = parseWorkoutText(text);

      // 3 blocks
      expect(result.blocks).toHaveLength(3);

      // Aquecimento
      expect(result.blocks[0].title).toBe('AQUECIMENTO');
      expect(result.blocks[0].rounds).toBe('3');

      // Força - bi-set + individual
      expect(result.blocks[1].title).toBe('FORÇA');
      const forcaExercises = result.blocks[1].exercises;
      expect(forcaExercises[0].name).toBe('Bench Press');
      expect(forcaExercises[0].type).toBe('bi-set');
      expect(forcaExercises[1].name).toBe('Triceps Rope');
      expect(forcaExercises[1].type).toBe('bi-set');
      expect(forcaExercises[2].name).toBe('Squat');
      expect(forcaExercises[2].type).toBe('single');
      expect(forcaExercises[2].prescription.load).toBe('80kg');

      // Metcon
      expect(result.blocks[2].title).toBe('METCON');
      expect(result.blocks[2].formatType).toBe('AMRAP');
      expect(result.blocks[2].timeCap).toBe('15');

      // Notes
      expect(result.globalNotes).toContain('Score: total rounds + reps');
      expect(result.globalNotes).toContain('RX:');
    });
  });

  // ── Spec from UX mock (double-asterisk headers + angle brackets) ──
  describe('spec: entrada do treino (mock)', () => {
    it('parses the force/accessories/conditioning example', () => {
      const text = [
        '**FORÇA**',
        '<Back Squat>',
        '5 x 5',
        'Carga alta',
        'Descanso 2min',
        '',
        '**ACESSÓRIOS**',
        '<Bench Press>+',
        '4 x 10-12',
        '<Triceps Rope>',
        '4 x 10-12',
        'Descanso 45s após os dois',
        '',
        '**CONDICIONAMENTO**',
        'For Time:',
        '500m Corrida',
        '35 Goblet Squat #32/24',
        '10 Ring Muscle Ups',
        '--',
        '500m Corrida',
        '25 Goblet Squat #32/24',
        '5 Ring Muscle Ups',
        'Time cap: 22min',
      ].join('\n');

      const result = parseWorkoutText(text);
      expect(result.blocks).toHaveLength(3);

      // Block titles normalized (no stray asterisks)
      expect(result.blocks[0].title).toBe('FORÇA');
      expect(result.blocks[1].title).toBe('ACESSÓRIOS');
      expect(result.blocks[2].title).toBe('CONDICIONAMENTO');

      // FORÇA
      const backSquat = result.blocks[0].exercises[0];
      expect(backSquat.name).toBe('Back Squat');
      expect(backSquat.prescription.sets).toBe('5');
      expect(backSquat.prescription.reps).toBe('5');
      expect(backSquat.prescription.notes).toContain('Carga alta');
      expect(backSquat.prescription.interval).toContain('Descanso 2min');

      // ACESSÓRIOS bi-set
      const accessories = result.blocks[1].exercises;
      expect(accessories).toHaveLength(2);
      expect(accessories[0].name).toBe('Bench Press');
      expect(accessories[0].type).toBe('bi-set');
      expect(accessories[0].prescription.sets).toBe('4');
      expect(accessories[0].prescription.reps).toBe('10-12');
      expect(accessories[1].name).toBe('Triceps Rope');
      expect(accessories[1].type).toBe('bi-set');
      expect(accessories[1].prescription.sets).toBe('4');
      expect(accessories[1].prescription.reps).toBe('10-12');

      // CONDICIONAMENTO
      const cond = result.blocks[2];
      expect(cond.formatType).toBe('FOR_TIME');
      expect(cond.timeCap).toBe('22');
      expect(cond.exercises[0].name).toBe('Corrida');
      expect(cond.exercises[0].prescription.distance).toBe('500m');
      expect(cond.exercises[1].name).toBe('Goblet Squat');
      expect(cond.exercises[1].prescription.reps).toBe('35');
      expect(cond.exercises[1].prescription.load).toBe('#32/24');
      expect(cond.exercises[2].name).toBe('Ring Muscle Ups');
      expect(cond.exercises[2].prescription.reps).toBe('10');
    });
  });
});
