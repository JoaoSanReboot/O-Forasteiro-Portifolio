import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { SceneCanvas } from '../../shared/scene-canvas/scene-canvas';
import { SecretsService } from '../secrets/secrets.service';
import { attachCandleSecret } from './candle-secret';
import { DrinksMenu } from './drinks-menu/drinks-menu';
import { SaloonService } from './saloon.service';
import { TicTacToe } from './tic-tac-toe/tic-tac-toe';

// VI · Saloon: as bebidas levam às redes; o bartender chama para um jogo da velha na própria cena,
// e a vela do lustre esconde um segredo (candle-secret.ts)
@Component({
  selector: 'section[appSaloon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas, TicTacToe, DrinksMenu],
  host: { class: 'sector alt flip', id: 'saloon', 'aria-labelledby': 't-saloon' },
  templateUrl: './saloon.html',
})
export class Saloon {
  private readonly saloonState = inject(SaloonService);
  private readonly secrets = inject(SecretsService);
  private readonly scene = viewChild.required(SceneCanvas);
  private readonly sceneEl = viewChild.required('scene', { read: ElementRef<HTMLElement> });
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly game = viewChild.required(TicTacToe);
  private readonly invite = viewChild.required<ElementRef<HTMLButtonElement>>('invite');
  private readonly injector = inject(Injector);

  protected readonly open = signal(false);
  protected readonly inviteHidden = this.saloonState.inviteHidden;
  protected readonly narrow = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // o painel e o convite ficam presos à cena do saloon; no celular o jogo abre logo abaixo dela
      const mq = window.matchMedia('(max-width: 560px)');
      const place = () => this.placePanel(mq.matches);
      this.scene().whenReady((runner) => {
        place();
        this.scene().pin(this.invite().nativeElement, 246, 42);
        attachCandleSecret(runner, this.saloonState.piano, this.saloonState.saloon, () => this.secrets.pianoDone());
      });
      mq.addEventListener('change', place);
      destroyRef.onDestroy(() => mq.removeEventListener('change', place));
    });
  }

  private placePanel(inline: boolean): void {
    (inline ? this.sceneEl().nativeElement : this.scene().layer()).appendChild(this.panel().nativeElement);
    this.narrow.set(inline);
  }

  protected openGame(): void {
    this.placePanel(this.narrow());
    this.open.set(true); this.saloonState.setPlaying(true);
    this.later(() => this.game().focusFirstFree());
  }

  protected close(e?: Event): void {
    e?.preventDefault();
    this.open.set(false); this.saloonState.setPlaying(false);
    this.later(() => this.invite().nativeElement.focus({ preventScroll: true }));
  }

  /** foca depois que o DOM refletir a mudança */
  private later(fn: () => void): void { afterNextRender(fn, { injector: this.injector }); }
}
