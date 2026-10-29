import { createArmeiro } from './armeiro';
import { createDelegacia } from './delegacia';
import { createEscola } from './escola';
import { createFerraria } from './ferraria';
import { createSaloon } from './saloon';
import { PianoState, SaloonState } from './saloon-state';
import { SceneDef } from './scene';
import { createTelegrafo } from './telegrafo';

/** estado de jogo que algumas cenas leem a cada quadro (fornecido pelos services) */
export interface SceneDeps {
  piano: PianoState;
  saloon: SaloonState;
}

export const SCENES = {
  ferraria: () => createFerraria(),
  delegacia: () => createDelegacia(),
  armeiro: () => createArmeiro(),
  telegrafo: () => createTelegrafo(),
  escola: () => createEscola(),
  saloon: (d) => createSaloon(d.piano, d.saloon),
} satisfies Record<string, (deps: SceneDeps) => SceneDef>;

export type SceneId = keyof typeof SCENES;

export type { SceneDef } from './scene';
