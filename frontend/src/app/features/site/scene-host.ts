import { inject, Provider } from '@angular/core';
import { SCENE_HOST, SceneHost, SCENES_ACTIVE } from '../../core/scene/scene-host';
import { DuelService } from '../duelo/duel.service';
import { HeroService } from '../heroes/hero.service';
import { IntroService } from '../intro/intro.service';
import { SaloonService } from '../saloon/saloon.service';
import { SecretsService } from '../secrets/secrets.service';

// O site liga as cenas ao resto: quando elas andam (depois da chegada), o estado de jogo que leem
// e os segredos desenhados e tocados por cima delas.
export function provideScenes(): Provider[] {
  return [
    { provide: SCENES_ACTIVE, useFactory: () => inject(IntroService).siteOn },
    {
      provide: SCENE_HOST,
      useFactory: (): SceneHost => {
        const { piano, saloon } = inject(SaloonService);
        const duel = inject(DuelService), heroes = inject(HeroService), secrets = inject(SecretsService);
        return {
          deps: { piano, saloon, duel: duel.state, hero: heroes.current, hasGun: secrets.hasGun },
          overlay: (id) => secrets.overlay(id),
          hover: (id, at) => secrets.hover(id, at),
          tap: (id, at) => secrets.tap(id, at),
        };
      },
    },
  ];
}
