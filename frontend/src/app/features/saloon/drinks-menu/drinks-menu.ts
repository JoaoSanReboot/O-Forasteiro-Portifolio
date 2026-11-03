import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';

const EMAIL = 'joaopedrosantanarosa@gmail.com';

// O cardápio do balcão: cada bebida leva a uma rede (GitHub, LinkedIn, Instagram) e o telegrama copia o e-mail
@Component({
  selector: 'div[appDrinksMenu]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drinks-menu.html',
})
export class DrinksMenu {
  private readonly email = viewChild.required<ElementRef<HTMLElement>>('email');
  protected readonly copyMsg = signal('');

  // sem permissão para a área de transferência, o e-mail fica selecionado para copiar à mão
  protected async copyEmail(): Promise<void> {
    try { await navigator.clipboard.writeText(EMAIL); this.copyMsg.set('E-mail copiado.'); }
    catch {
      const r = document.createRange(); r.selectNodeContents(this.email().nativeElement);
      const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
      this.copyMsg.set('Selecionei o e-mail: é só copiar.');
    }
  }
}
