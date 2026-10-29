import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('migra o formato antigo (vila-moedas e vila-revolver)', () => {
    localStorage.setItem('vila-moedas', JSON.stringify(['armeiro', 'saloon', 'inventada']));
    localStorage.setItem('vila-revolver', '1');
    const p = TestBed.inject(ProgressService);
    expect(p.progress.coins).toEqual(['armeiro', 'saloon']);
    expect(p.found()).toBe(3);
  });

  it('pega a moeda tocando perto dela, uma vez só', () => {
    const p = TestBed.inject(ProgressService);
    expect(p.tap('ferraria', [100, 20])).toBe(false);
    expect(p.tap('ferraria', [262, 93])).toBe(true);
    expect(p.tap('ferraria', [262, 93])).toBe(false);
    expect(p.found()).toBe(1);
    expect(JSON.parse(localStorage.getItem('vila-progresso')!).coins).toEqual(['ferraria']);
  });

  it('o revólver só sai com todas as moedas; o reset esconde tudo de novo', () => {
    const p = TestBed.inject(ProgressService);
    p.tap('armeiro', [110, 80]);
    expect(p.hasGun()).toBe(false);
    for (const [id, x, y] of [['armeiro', 163, 104], ['ferraria', 262, 92], ['delegacia', 176, 12], ['telegrafo', 178, 78], ['escola', 190, 105], ['saloon', 245, 53], ['fimdarua', 247, 53]] as const) p.tap(id, [x, y]);
    p.tap('armeiro', [110, 80]);
    expect(p.hasGun()).toBe(true);
    p.pianoDone();
    expect(p.done()).toBe(true);
    p.reset();
    expect(p.found()).toBe(0);
    expect(localStorage.getItem('vila-progresso')).toBeNull();
  });
});
