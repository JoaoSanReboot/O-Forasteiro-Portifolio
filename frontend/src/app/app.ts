import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { Skills } from './site/skills/skills';

// Casca do portfólio. Até a abertura chegar (fase 4) o site aparece direto, já no modo "site-on" do legado.
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skills],
  template: `
    <div id="site">
      <main>
        <section appSkills></section>
      </main>
    </div>
  `,
})
export class App {
  constructor() {
    inject(DOCUMENT).documentElement.classList.add('site-on');
  }
}
