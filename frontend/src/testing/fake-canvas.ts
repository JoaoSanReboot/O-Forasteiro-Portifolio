// Contexto 2D falso para os testes: o jsdom não desenha, então registramos cada chamada.
export type CanvasOp = readonly [string, ...unknown[]];

export interface FakeCtx extends CanvasRenderingContext2D {
  readonly ops: CanvasOp[];
}

export function fakeCtx(): FakeCtx {
  const ops: CanvasOp[] = [];
  const state: Record<string | symbol, unknown> = { fillStyle: '#000000', globalAlpha: 1, imageSmoothingEnabled: true, ops };
  return new Proxy(state, {
    get(target, prop) {
      if (prop in target) return target[prop];
      // qualquer método vira um registro (fillRect, drawImage, save, clip...)
      return (...args: unknown[]) => {
        ops.push([String(prop), ...(prop === 'fillRect' ? [target['fillStyle'], ...args] : args)]);
        return prop === 'createPattern' ? {} : undefined;
      };
    },
    set(target, prop, value) { target[prop] = value; return true; },
  }) as unknown as FakeCtx;
}

/** faz todo canvas criado no teste devolver um contexto falso */
export function installFakeCanvas(): void {
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement & { __fake?: FakeCtx }) {
    return (this.__fake ??= fakeCtx());
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

/** só os fillRect, com a cor de cada um: [cor, x, y, w, h] */
export const rects = (g: FakeCtx): CanvasOp[] => g.ops.filter((o) => o[0] === 'fillRect').map((o) => o.slice(1) as unknown as CanvasOp);
