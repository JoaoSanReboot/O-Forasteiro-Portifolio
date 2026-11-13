import type Lenis from 'lenis';

// Rolagem com inércia (Lenis): a roda do mouse não dá trancos de 100 px, a página desliza e
// desacelera. No toque a rolagem continua a nativa do aparelho. Com "reduzir movimento" a
// rolagem segue a roda 1:1 (o próprio Lenis respeita a preferência).
// A biblioteca chega num pedaço à parte, só quando o site aparece: não pesa na abertura.

export interface SmoothScroll {
  /** segura a rolagem (abertura ou menu do celular na frente) */
  stop(): void;
  start(): void;
  /** para a inércia e devolve a rolagem nativa */
  destroy(): void;
}

const NATIVE: SmoothScroll = { stop() {}, start() {}, destroy() {} };

export async function startSmoothScroll(): Promise<SmoothScroll> {
  // navegador sem ResizeObserver (ou o jsdom dos testes): fica a rolagem nativa
  if (typeof ResizeObserver === 'undefined') return NATIVE;
  const { default: LenisCtor } = await import('lenis');
  const lenis: Lenis = new LenisCtor({
    autoRaf: true,
    // quanto menor, mais longa a desaceleração (0,1 é o padrão; 0,09 fica macio sem parecer lento)
    lerp: 0.09,
    wheelMultiplier: 0.95,
    // os links "#seção" deslizam até o título (o scroll-margin-top das seções desconta a barra fixa)
    anchors: true,
    stopInertiaOnNavigate: true,
    // menus e quadros com rolagem própria continuam rolando por dentro
    allowNestedScroll: true,
  });
  return { stop: () => lenis.stop(), start: () => lenis.start(), destroy: () => lenis.destroy() };
}
