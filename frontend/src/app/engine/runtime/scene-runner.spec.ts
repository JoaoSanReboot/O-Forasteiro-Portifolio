import { FakeCtx, installFakeCanvas } from '../../../testing/fake-canvas';
import { createArmeiro } from '../scenes/armeiro';
import { SceneRunner } from './scene-runner';

describe('SceneRunner', () => {
  beforeAll(installFakeCanvas);

  const make = () => new SceneRunner('armeiro', document.createElement('canvas'), createArmeiro());
  const buffer = (s: SceneRunner) => (s as unknown as { wg: FakeCtx }).wg.ops;

  it('cena larga: ampliação 2 e a arte inteira', () => {
    const s = make();
    s.size(652);
    expect([s.scale, s.W, s.camX]).toEqual([2, 320, 0]);
    expect(s.canvas.style.width).toBe('640px');
    expect(s.canvas.height).toBe(150);
  });

  it('cena estreita: recorte centrado no foco, sem sair da arte', () => {
    const s = make();
    s.size(400);
    expect([s.scale, s.W, s.camX]).toEqual([2, 194, 68]);
    s.size(100);
    expect([s.scale, s.W, s.camX]).toEqual([1, 160, 85]);
  });

  it('pinta igual no mesmo instante (determinístico)', () => {
    const a = make(), b = make();
    a.size(652); b.size(652);
    a.paint(19.8, 0.016); b.paint(19.8, 0.016);
    expect(buffer(a).length).toBeGreaterThan(100);
    expect(buffer(a)).toEqual(buffer(b));
    expect(a.drawn).toBe(true);
  });

  it('converte o clique para coordenadas da arte', () => {
    const s = make();
    s.size(400);
    s.canvas.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
    expect(s.toScene(10 + 40, 20 + 30)).toEqual([68 + 20, 15]);
  });
});
