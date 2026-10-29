import { cancelRaf, nextFrame, raf } from './browser';

describe('quadros seguros (raf/cancelRaf)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('no navegador, repassam para requestAnimationFrame e cancelAnimationFrame', () => {
    const req = vi.fn(() => 7), cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', req); vi.stubGlobal('cancelAnimationFrame', cancel);
    const cb = () => {};
    expect(raf(cb)).toBe(7);
    expect(req).toHaveBeenCalledWith(cb);
    cancelRaf(7);
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('cancelar o 0 (nada agendado) não chama ninguém', () => {
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    cancelRaf(0);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('fora do navegador (SSR), não agendam nada e não quebram', async () => {
    vi.stubGlobal('requestAnimationFrame', undefined); vi.stubGlobal('cancelAnimationFrame', undefined);
    const cb = vi.fn();
    expect(raf(cb)).toBe(0);
    expect(() => cancelRaf(3)).not.toThrow();
    await expect(nextFrame()).resolves.toBeUndefined();
    expect(cb).not.toHaveBeenCalled();
  });
});
