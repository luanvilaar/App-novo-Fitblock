import { describe, expect, it } from 'vitest';
import { resolveCatalogEntry } from './resolve-catalog';
import type { ExerciseCatalogEntry } from './parsed-to-workout-items';

const cat = (id: string, name: string): ExerciseCatalogEntry => ({
  id,
  name,
  video_url: null,
});

describe('resolveCatalogEntry', () => {
  it('match exato normalizado', () => {
    const catalog = [cat('1', 'Back Squat')];
    const r = resolveCatalogEntry('back squat', catalog);
    expect(r?.id).toBe('1');
    expect(r?.name).toBe('Back Squat');
  });

  it('sufixo extra após espaço: back squat costas → back squat', () => {
    const catalog = [cat('a', 'back squat')];
    const r = resolveCatalogEntry('back squat costas', catalog);
    expect(r?.id).toBe('a');
  });

  it('desempate pelo nome canónico mais longo', () => {
    const catalog = [cat('short', 'squat'), cat('long', 'back squat')];
    const r = resolveCatalogEntry('back squat costas', catalog);
    expect(r?.id).toBe('long');
  });

  it('sem match quando não há prefixo com espaço', () => {
    const catalog = [cat('1', 'goblet squat')];
    expect(resolveCatalogEntry('front squat', catalog)).toBeNull();
  });

  it('sem match se catálogo vazio', () => {
    expect(resolveCatalogEntry('anything', [])).toBeNull();
  });
});
