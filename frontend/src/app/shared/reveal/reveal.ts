import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { PlatformService } from '../../core/platform/platform.service';

// Entrada ao rolar: o elemento começa recolhido (classe `rv`) e entra (classe `in`) quando aparece
// na tela, uma vez só. O estilo de cada jeito de entrar mora em styles/_motion.scss
// (`appReveal="up"`, `"mask"`, `"line"`...). `revealDelay` escalona irmãos (em passos de 80 ms).
// No servidor e com "reduzir movimento" nada é recolhido: o conteúdo já está lá.
@Directive({
  selector: '[appReveal]',
  host: { '[attr.data-reveal]': 'appReveal() || "up"', '[style.--rv-delay]': 'revealDelay() * 80 + "ms"' },
})
export class Reveal {
  readonly appReveal = input<string>('');
  readonly revealDelay = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const platform = inject(PlatformService), destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (platform.reduceMotion || !('IntersectionObserver' in window)) return;
      el.classList.add('rv');
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
      io.observe(el);
      destroyRef.onDestroy(() => io.disconnect());
    });
  }
}
