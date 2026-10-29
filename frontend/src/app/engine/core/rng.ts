// gerador do legado (Park–Miller): as cenas reiniciam a semente no meio do desenho e
// dependem da sequência que vem depois, então cada "mundo" usa uma instância compartilhada
export class Rng {
  constructor(public seed = 1) {}

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }
}

/** a semente única das cenas do site (o `seed` de site.js) */
export const sceneRng = new Rng(1);
