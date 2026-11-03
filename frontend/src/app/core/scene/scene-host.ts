import { InjectionToken, Signal } from '@angular/core';
import { Ctx } from '../../engine/core/canvas';
import { Pt } from '../../engine/draw/primitives';
import { SceneDeps, SceneId } from '../../engine/scenes';

// O que as cenas precisam do resto do site. O core e o shared só conhecem estes contratos;
// quem os implementa é o site (features/site/scene-host.ts), registrado em app.config.ts.

/** o site está aberto: com a tela inicial por cima, as cenas não andam nem se medem */
export const SCENES_ACTIVE = new InjectionToken<Signal<boolean>>('SCENES_ACTIVE');

export interface SceneHost {
  /** estado de jogo que algumas cenas leem a cada quadro (saloon, duelo, personagem, revólver) */
  readonly deps: SceneDeps;
  /** desenhado por cima da cena a cada quadro (as moedas escondidas e o revólver à venda) */
  overlay(id: SceneId): (g: Ctx, t: number) => void;
  /** o ponteiro está sobre algo clicável (para o cursor de mãozinha) */
  hover(id: SceneId, at: Pt): boolean;
  /** um toque na cena; devolve se ele foi usado */
  tap(id: SceneId, at: Pt): boolean;
}

export const SCENE_HOST = new InjectionToken<SceneHost>('SCENE_HOST');
