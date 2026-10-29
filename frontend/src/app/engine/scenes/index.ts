import { createArmeiro } from './armeiro';
import { SceneDef } from './scene';

// as cenas entram aqui conforme cada seção é migrada (fase 3)
export const SCENES = {
  armeiro: createArmeiro,
} satisfies Record<string, () => SceneDef>;

export type SceneId = keyof typeof SCENES;

export type { SceneDef } from './scene';
