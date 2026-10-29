import { inject, Injectable, isDevMode, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { createVilaAudio, DuelFx, TrackName, VilaAudio } from '../engine/audio/vila-audio';
import { PlatformService } from './platform.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

declare global {
  interface Window {
    /** só para conferir as transições da trilha (build de desenvolvimento) */
    VilaAudio?: VilaAudio;
  }
}

// a trilha e os efeitos (Web Audio); no build estático não há som, e tudo vira silêncio
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly storage = inject(StorageService);
  private readonly isBrowser = inject(PlatformService).isBrowser;
  /** o alto-falante: ligado ou mudo (a música não reinicia, só o volume muda) */
  readonly on = signal(this.storage.get(STORAGE_KEYS.sound) !== 'off');
  readonly audio: VilaAudio | null = this.isBrowser
    ? createVilaAudio({ enabled: this.on(), duelMusicUrl: environment.duelMusicUrl, persist: (on) => this.storage.set(STORAGE_KEYS.sound, on ? 'on' : 'off') })
    : null;

  constructor() {
    if (!this.audio) return;
    if (isDevMode()) window.VilaAudio = this.audio;
    // o navegador só deixa tocar depois do primeiro toque ou tecla: aí a trilha pedida começa
    const firstGesture = () => { if (this.audio!.on) void this.audio!.unlock(); };
    window.addEventListener('pointerdown', firstGesture, { once: true, capture: true });
    window.addEventListener('keydown', firstGesture, { once: true, capture: true });
  }

  toggle(): void {
    this.audio?.setEnabled(!this.on());
    this.on.update((v) => !v);
  }

  cue(name: TrackName, restart = false): void { this.audio?.cue(name, restart); }
  fx(name: DuelFx): void { this.audio?.fx(name); }
}
