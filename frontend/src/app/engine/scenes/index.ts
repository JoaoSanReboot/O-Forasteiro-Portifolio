import { createArmeiro } from './armeiro';
import { createDelegacia } from './delegacia';
import { DuelState } from './duel-state';
import { createEscola } from './escola';
import { createFerraria } from './ferraria';
import { createFimDaRua } from './fimdarua';
import { Hero } from '../heroes/heroes';
import { createSaloon } from './saloon';
import { PianoState, SaloonState } from './saloon-state';
import { SceneDef } from './scene';
import { createTelegrafo } from './telegrafo';

/** estado de jogo que algumas cenas leem a cada quadro (fornecido pelos services) */
export interface SceneDeps {
  piano: PianoState;
  saloon: SaloonState;
  duel: DuelState;
  /** o personagem escolhido na tela inicial */
  hero: () => Hero;
  /** o visitante já comprou o revólver aprimorado */
  hasGun: () => boolean;
}

export const SCENES = {
  ferraria: () => createFerraria(),
  delegacia: () => createDelegacia(),
  armeiro: () => createArmeiro(),
  telegrafo: () => createTelegrafo(),
  escola: () => createEscola(),
  saloon: (d) => createSaloon(d.piano, d.saloon),
  fimdarua: (d) => createFimDaRua(d),
} satisfies Record<string, (deps: SceneDeps) => SceneDef>;

export type SceneId = keyof typeof SCENES;

export type { SceneDef } from './scene';
