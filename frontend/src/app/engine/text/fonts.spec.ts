import { fakeCtx, rects } from '../../../testing/fake-canvas';
import { charX, pixelText, textWidth } from './pixel-font';
import { tinyText, tinyWidth } from './tiny-font';

describe('fontes de pixel', () => {
  it('mede 1 px entre letras e 2 px de espaço', () => {
    expect(textWidth('SKILLS')).toBe(33);
    expect(textWidth('NÃO ATIRE')).toBe(textWidth('NAO ATIRE'));
    expect(charX('BUGS', 10, 2)).toBe(10 + 6 + 6);
  });

  it('fonte pequena: letras de 3 px, M e W de 5', () => {
    expect(tinyWidth('API')).toBe(11);
    expect(tinyWidth('MW')).toBe(11);
    expect(tinyWidth('Ç')).toBe(tinyWidth('C'));
  });

  it('pixelText centraliza e devolve o x final', () => {
    const g = fakeCtx();
    const end = pixelText(g, 'I', 100, 0, '#123456');
    expect(end).toBe(Math.round(100 - 3 / 2) + 4);
    expect(rects(g).every((r) => r[0] === '#123456')).toBe(true);
    expect(rects(g)).toHaveLength(3 + 5 + 3); // I: 3 em cima, 5 no meio, 3 embaixo
  });

  it('tinyText desenha os acentos', () => {
    const plain = fakeCtx(), accent = fakeCtx();
    tinyText(plain, 'E', 0, 0, '#000');
    tinyText(accent, 'É', 0, 0, '#000');
    expect(rects(accent).length).toBe(rects(plain).length + 1);
  });
});
