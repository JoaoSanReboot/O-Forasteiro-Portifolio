import { Weapon } from '../../engine/heroes/heroes';

export type LevelId = 'facil' | 'normal' | 'dificil';
export interface Level { name: string; wins: number; period: number; zone: number; perfect: number; speedUp: number; mashNeed: number; mashTime: number }

// tempo do marcador (ms), faixa vermelha e amarela (% da barra), rodadas para vencer e o fôlego da raiva (rolo)
export const LEVELS: Record<LevelId, Level> = {
  facil: { name: 'Fácil', wins: 2, period: 1700, zone: 28, perfect: 12, speedUp: 0.97, mashNeed: 8, mashTime: 2700 },
  normal: { name: 'Normal', wins: 3, period: 1250, zone: 20, perfect: 8, speedUp: 0.95, mashNeed: 11, mashTime: 2200 },
  dificil: { name: 'Difícil', wins: 4, period: 900, zone: 13, perfect: 5, speedUp: 0.94, mashNeed: 14, mashTime: 1800 },
};
export const LEVEL_IDS = Object.keys(LEVELS) as LevelId[];

type Line = readonly [call: string, stamp: string, why: string];
export interface Kit {
  arma: string; call: string; btn: string; btn2?: string; hold?: boolean; mash?: boolean;
  rules: readonly string[]; aim: string; aim2?: string;
  yellow: Line; red: Line; miss: Line; slow: Line;
  win: string; flawless: string; lose: string; unit: string;
}

// cada personagem tem a sua arma, a sua mecânica e as suas falas
export const KIT: Record<Weapon, Kit> = {
  revolver: { arma: 'revólver', call: 'SAQUE!', btn: 'Atirar',
    rules: ['Espere o sino. Atirou antes? Perde a rodada. O João vai tentar te enganar.', 'Quando aparecer <b>SAQUE!</b>, um marcador corre pela barra, logo acima do botão <b>Atirar</b>.', 'Atire quando ele passar pela <b>faixa amarela</b> (botão, clique na cena ou <b>Espaço</b>).', 'Fora da faixa, ou se o marcador chegar ao fim da barra, o João atira primeiro.'],
    aim: 'Atire quando o marcador passar na faixa amarela.',
    yellow: ['Tiro perfeito!', 'Perfeito!', 'Bem na faixa amarela. O chapéu do João foi parar longe.'], red: ['Na mosca!', 'Acertou!', 'Na faixa vermelha: o revólver aprimorado garantiu a rodada.'],
    miss: ['Errou o tempo!', 'Errou!', 'O tiro saiu fora da faixa. O João não perdoou.'], slow: ['Lento demais!', 'Lento!', 'O marcador chegou ao fim. O João sacou primeiro.'],
    win: 'Você venceu o dev mais temido do Oeste.', flawless: 'Sem levar um tiro. A vila vai falar disso por anos.', lose: 'O João segue invicto. Por enquanto.', unit: 'Tiros certeiros' },
  twin: { arma: 'duas pistolas', call: 'SAQUE DUPLO!', btn: 'Atirar',
    rules: ['Espere o sino. Sacou antes? Perde a rodada.', 'Quando aparecer <b>SAQUE DUPLO!</b>, a barra ganha <b>duas faixas amarelas</b>: uma para cada pistola.', 'Cada clique (ou <b>Espaço</b>) dispara uma pistola. Acerte as duas faixas na mesma passada do marcador.', 'Errou uma das duas, ou o marcador chegou ao fim? O João atira primeiro.'],
    aim: 'Uma pistola em cada faixa amarela.',
    yellow: ['Duas na mosca!', 'Duplo!', 'Esquerda e direita certeiras: o chapéu do João virou peneira.'], red: ['Duas no alvo!', 'Duplo!', 'As duas pistolas acertaram, com uma ajudinha do revólver aprimorado.'],
    miss: ['Uma pistola falhou!', 'Errou!', 'Um dos tiros saiu fora da faixa. O João aproveitou.'], slow: ['Faltou uma pistola!', 'Lento!', 'O marcador passou antes do segundo tiro.'],
    win: 'Duas pistolas, nenhuma palavra: o João perdeu.', flawless: 'Nem um arranhão. Ninguém sabe quem você é, mas todo mundo vai saber o que fez.', lose: 'O João segue invicto. Desta vez as duas pistolas não bastaram.', unit: 'Rodadas com as duas pistolas certeiras' },
  lasso: { arma: 'laço', call: 'LAÇA!', btn: 'Segure para girar o laço', hold: true,
    rules: ['Espere o sino. Começou a girar antes? Perde a rodada.', 'Quando aparecer <b>LAÇA!</b>, segure o botão (ou <b>Espaço</b>) para girar o laço: o marcador vai e volta na barra.', 'Solte quando ele estiver na <b>faixa amarela</b> e o laço voa direto no João.', 'Soltou fora da faixa, ou demorou demais girando? O João saca antes.'],
    aim: 'Segure para girar e solte na faixa amarela.',
    yellow: ['Laçado!', 'Laçado!', 'O laço fechou certinho em volta do João.'], red: ['Pegou de raspão!', 'Laçado!', 'Laço frouxo, mas o revólver aprimorado no coldre deu confiança.'],
    miss: ['Laço curto!', 'Errou!', 'O laço caiu na poeira antes de chegar.'], slow: ['Demorou no laço!', 'Lento!', 'Enquanto o laço girava, o João sacou.'],
    win: 'João amarrado feito bezerro em rodeio!', flawless: 'Nem um tiro levou: a vaqueira mais rápida da região.', lose: 'O João escapou do laço. Por enquanto.', unit: 'Laçadas certeiras' },
  pin: { arma: 'rolo de amassar pão', call: 'AGORA, MENINO!', btn: 'Bater!', mash: true,
    rules: ['Espere o sino. Bateu antes? Perde a rodada (e leva bronca).', 'Quando aparecer <b>AGORA, MENINO!</b>, toque no botão (ou aperte <b>Espaço</b>) bem rápido para encher a barra de raiva.', 'Barra cheia antes de o João sacar: o rolo voa direto na testa dele.', 'Se a raiva não encher a tempo, o João saca primeiro.'],
    aim: 'Toque rápido para encher a barra de raiva!',
    yellow: ['PLAFT!', 'PLAFT!', 'Rolo na testa: o João viu estrelinhas.'], red: ['PLAFT!', 'PLAFT!', 'Rolo na testa: o João viu estrelinhas.'],
    miss: ['Escorregou!', 'Errou!', 'O rolo escorregou da mão.'], slow: ['Faltou raiva!', 'Lento!', 'A barra não encheu a tempo. O João sacou primeiro.'],
    win: 'Rolo na testa: o João vai pensar duas vezes antes de bagunçar a cozinha.', flawless: 'Nenhum tiro, só rolo: respeitem a senhora!', lose: 'O João escapou da bronca. Por enquanto.', unit: 'Roladas na testa' },
  rifle: { arma: 'rifle', call: 'ENGATILHA!', btn: 'Engatilhar', btn2: 'Disparar',
    rules: ['Espere o sino. Engatilhou antes? Perde a rodada.', 'Quando aparecer <b>ENGATILHA!</b>, clique uma vez (ou <b>Espaço</b>) para levantar e engatilhar o rifle.', 'Aí a mira balança pela barra: dispare quando ela passar na <b>faixa amarela</b>.', 'Errou a faixa, ou demorou para disparar? O João saca primeiro.'],
    aim: 'Engatilhe o rifle primeiro!', aim2: 'Mira balançando: dispare na faixa amarela.',
    yellow: ['Tiro certeiro!', 'Certeiro!', 'O estampido ecoou no sertão e o chapéu do João sumiu.'], red: ['Acertou!', 'Acertou!', 'A mira tremeu, mas o revólver aprimorado de reserva deu coragem.'],
    miss: ['Bala perdida!', 'Errou!', 'O tiro do rifle passou longe. O João não perdoou.'], slow: ['Demorou na mira!', 'Lento!', 'Enquanto você mirava, o João sacou.'],
    win: 'Tiro de rifle que ecoou no sertão inteiro.', flawless: 'O cangaço mandou lembrança: nenhum tiro de volta.', lose: 'O João segue invicto. O sertão espera a revanche.', unit: 'Disparos certeiros' },
};

export const BLUFFS = ['O João mexeu os dedos perto do coldre...', 'Um carcará piou lá no alto...', 'Uma bola de feno passou rolando...', 'O João estalou o pescoço...'];

export interface Zone { s: number; w: number; p: number; mid: number; hit: boolean; yellow: boolean }

export function makeZone(L: Level, lo: number, hi: number, rand = Math.random): Zone {
  const w = L.zone, p = L.perfect, s = lo + rand() * (hi - lo - w);
  return { s, w, p, mid: s + w / 2, hit: false, yellow: false };
}

/** onde caiu o disparo: na faixa amarela, na vermelha (só com o revólver aprimorado) ou fora */
export function judge(a: number, z: Zone, hasGun: boolean): 'yellow' | 'red' | null {
  const g = 0.8;
  if (Math.abs(a - z.mid) <= z.p / 2 + g) return 'yellow';
  if (hasGun && a >= z.s - g && a <= z.s + z.w + g) return 'red';
  return null;
}
