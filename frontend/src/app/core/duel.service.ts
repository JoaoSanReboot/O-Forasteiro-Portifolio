import { Injectable } from '@angular/core';
import { createDuelState } from '../engine/scenes/duel-state';

// o duelo ao pôr do sol: o estado quadro a quadro fica num objeto comum, lido pela cena do fim da rua
@Injectable({ providedIn: 'root' })
export class DuelService {
  readonly state = createDuelState();
}
