import { Injectable, signal } from '@angular/core';
import { createPianoState, createSaloonState } from '../engine/scenes/saloon-state';

// O Saloon: o estado quadro a quadro fica nos objetos comuns (lidos pela cena);
// para a interface, só o que ela mostra vira Signal.
@Injectable({ providedIn: 'root' })
export class SaloonService {
  readonly piano = createPianoState();
  readonly saloon = createSaloonState();

  /** o convite do jogo da velha some enquanto o Tião está fora ou o jogo está aberto */
  readonly inviteHidden = signal(false);

  constructor() {
    this.saloon.onInviteHidden = (hidden) => this.inviteHidden.set(hidden);
  }

  setPlaying(on: boolean): void {
    this.saloon.playing = on;
  }
}
