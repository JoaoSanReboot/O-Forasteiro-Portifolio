import { mixColor, shade, shadeHex } from './color';

describe('cores', () => {
  it('shade devolve rgb() e limita em 255', () => {
    expect(shade('#808080', 0.5)).toBe('rgb(64,64,64)');
    expect(shade('#c08040', 2)).toBe('rgb(255,255,128)');
    expect(shade('#646464')).toBe('rgb(75,75,75)');
  });

  it('shadeHex devolve #hex com dois dígitos por canal', () => {
    expect(shadeHex('#102030', 2)).toBe('#204060');
    expect(shadeHex('#0a0a0a', 0.5)).toBe('#050505');
  });

  it('mixColor vai de uma cor à outra e trava fora de 0..1', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('rgb(0,0,0)');
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('rgb(128,128,128)');
    expect(mixColor('#000000', '#ffffff', 3)).toBe('rgb(255,255,255)');
  });
});
