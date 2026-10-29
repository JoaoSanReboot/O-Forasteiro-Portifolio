import { Weapon } from '../heroes/heroes';

// Estado do duelo que a cena do fim da rua lê a cada quadro (objeto comum, não Signal).
// O componente do duelo escreve aqui; os tempos são de performance.now().

export type DuelPhase = 'idle' | 'wait' | 'draw' | 'you' | 'joao';
export type DuelAnimMode = 'idle' | 'wait' | 'draw' | 'fire' | 'spin' | 'throw' | 'caught' | 'fall' | 'wind' | 'drop' | 'cock' | 'aim';

export interface FlyingHat { x: number; y: number; vx: number; vy: number; r: number; col: string; ground: number }

export interface DuelAnim {
  weapon: Weapon;
  mode: DuelAnimMode;
  at: number;
  /** disparos das duas pistolas: a de cima (R) e a de baixo (L) */
  shots: { side: 'L' | 'R'; at: number }[];
  /** força acumulada (laço girando, raiva do rolo), de 0 a 1 */
  charge: number;
}

export interface DuelState {
  on: boolean;
  phase: DuelPhase;
  shotBy: 'you' | 'joao' | null;
  shotAt: number;
  bellAt: number;
  twitchAt: number;
  hat: { you: boolean; joao: boolean };
  flying: FlyingHat[];
  anim: DuelAnim;
}

export const createDuelState = (): DuelState => ({
  on: false, phase: 'idle', shotBy: null, shotAt: 0, bellAt: 0, twitchAt: -9999, hat: { you: true, joao: true }, flying: [],
  anim: { weapon: 'revolver', mode: 'idle', at: 0, shots: [], charge: 0 },
});
