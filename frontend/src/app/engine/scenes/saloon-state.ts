// Estado do Saloon que a cena lê e altera a cada quadro (objetos comuns, não Signals).
// O segredo da vela (fase 4) e o jogo da velha escrevem aqui; a cena avisa as mudanças pelos ganchos.

export type CandleState = 'lustre' | 'held' | 'burning' | 'returning';

/** a palavra "NÃO" do aviso, em pixels da arte */
export interface WordBox { x0: number; x1: number; y0: number; y1: number; cx: number; cy: number }

/** linha do tempo da sequência da vela, em segundos */
export interface PianoTimeline {
  burn: number; notice: number; run: number; gone: number; tiaoOut: number; atSign: number; toss: number;
  hang: number; hung: number; back: number; sit: number; play: number; tiaoBack: number; end: number;
}

export interface PianoState {
  state: 'idle' | 'seq';
  candle: CandleState;
  start: number;
  pourT: number;
  cx: number;
  cy: number;
  origin: [number, number];
  retFrom: [number, number];
  retAt: number;
  word: WordBox | null;
  slot: { x: number; y: number };
  /** fundo pré-desenhado da cena, para repintar o cartaz pendurado de novo */
  bc: HTMLCanvasElement | null;
  TL: PianoTimeline | null;
  onDone: (() => void) | null;
}

export interface SaloonState {
  /** o jogo da velha está aberto */
  playing: boolean;
  /** chamado quando o convite do jogo da velha deve sumir ou voltar (enquanto o Tião está fora) */
  onInviteHidden: ((hidden: boolean) => void) | null;
  inviteHidden: boolean;
}

export const createPianoState = (): PianoState => ({
  state: 'idle', candle: 'lustre', start: 0, pourT: 0, cx: 0, cy: 0, origin: [0, 0], retFrom: [0, 0], retAt: 0,
  word: null, slot: { x: 170, y: 11 }, bc: null, TL: null, onDone: null,
});

export const createSaloonState = (): SaloonState => ({ playing: false, onInviteHidden: null, inviteHidden: false });
