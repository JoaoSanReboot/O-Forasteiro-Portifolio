import { TIMELINE as P } from './timeline';

// A narração na faixa de cima: cada frase fica parada no lugar e as palavras vão acendendo no ritmo da história

const TALE: readonly { at: number; text: string; big?: boolean }[] = [
  { at: 2.0, text: 'Contam as lendas que, numa vila simples do sertão, surgiu um grande programador.' },
  { at: 7.6, text: 'Um dos mais rápidos do oeste.' },
  { at: 11.6, text: 'Nunca perdeu um duelo.' },
  { at: 15.6, text: 'Nunca teve piedade de bugs.' },
  { at: 20.0, text: 'Dizem que o código dele é tão limpo que brilha no sol. Dá para reconhecer a mais de um quilômetro.' },
  { at: 26.6, big: true, text: 'Um dos programadores mais temidos do oeste.' },
];
const WORDS_PER_S = 4.2; // palavras por segundo de história

interface TaleNode { el: HTMLElement; line: (typeof TALE)[number]; words: HTMLElement[]; shown: number; announced: boolean }

/** `tale` mostra as palavras acendendo; `taleSr` anuncia a frase inteira para o leitor de tela */
export class Tale {
  private nodes: TaleNode[] = [];

  constructor(private readonly tale: HTMLElement, private readonly taleSr: HTMLElement) {}

  reset(): void {
    this.tale.innerHTML = ''; this.nodes = [];
    TALE.forEach((line) => {
      const el = document.createElement('p');
      if (line.big) el.className = 'big';
      const words = line.text.split(' ').map((w, i) => {
        const span = document.createElement('span');
        span.className = 'w'; span.textContent = (i ? ' ' : '') + w;
        el.appendChild(span);
        return span;
      });
      this.tale.appendChild(el);
      this.nodes.push({ el, line, words, shown: 0, announced: false });
    });
  }

  update(p: number): void {
    const nodes = this.nodes;
    let current = -1;
    nodes.forEach((n, i) => { if (p >= n.line.at) current = i; });
    nodes.forEach((n, i) => {
      const next = nodes[i + 1];
      const end = next ? next.line.at - 0.6 : P.posterStart + 1.2;
      n.el.classList.toggle('on', i === current && p < end);
      if (i !== current) return;
      const count = Math.min(n.words.length, Math.floor((p - n.line.at) * WORDS_PER_S) + 1);
      for (let k = n.shown; k < count; k++) n.words[k].classList.add('in');
      n.shown = Math.max(n.shown, count);
      if (!n.announced) { n.announced = true; this.taleSr.textContent = n.line.text; }
    });
  }
}
