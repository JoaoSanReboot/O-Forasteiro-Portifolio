import { TestBed } from '@angular/core/testing';
import { COIN_FACTS } from '../../content/jogos';
import { Coin } from './coin';
import { COIN_IDS, SecretsService } from './secrets.service';

// A caça às moedas: cada moeda conta um causo e o bolso cheio libera o revólver aprimorado
describe('Moedas escondidas', () => {
  beforeEach(() => localStorage.removeItem('forasteiro-moedas'));

  it('cada moeda conta uma vez, traz o seu causo e o bolso cheio libera o revólver', () => {
    const s = TestBed.inject(SecretsService);
    s.collect('horizonte'); s.collect('horizonte');
    expect(s.count()).toBe(1);
    expect(s.news()?.text).toBe(`1 de 5 · ${COIN_FACTS.horizonte}`);
    for (const id of COIN_IDS) s.collect(id);
    expect(s.gun()).toBe(true);
    expect(s.news()?.text).toContain('revólver aprimorado');
    expect(JSON.parse(localStorage.getItem('forasteiro-moedas')!)).toHaveLength(5);
    s.reset();
    expect(s.count()).toBe(0);
  });

  it('o que estava salvo volta depois da hidratação, ignorando lixo', () => {
    localStorage.setItem('forasteiro-moedas', JSON.stringify(['couro', 'couro', 'nada', 3]));
    const s = TestBed.inject(SecretsService);
    expect(s.count()).toBe(0);
    s.restore();
    expect(s.count()).toBe(1);
    expect(s.has('couro')).toBe(true);
  });

  it('a moeda escondida aparece no navegador e vai para o bolso ao clicar', async () => {
    await TestBed.configureTestingModule({ imports: [Coin] }).compileComponents();
    const fixture = TestBed.createComponent(Coin);
    fixture.componentRef.setInput('coin', 'rodape');
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.coin')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(SecretsService).has('rodape')).toBe(true);
  });
});
