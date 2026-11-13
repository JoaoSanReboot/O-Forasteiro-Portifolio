/** as armas do duelo */
export type Weapon = 'revolver' | 'twin' | 'lasso' | 'pin' | 'rifle';

/** o carimbo da rodada: o grito e o porquê */
type Line = readonly [stamp: string, why: string];
export interface Kit {
  label: string; call: string; btn: string; btn2?: string;
  aim: string; aim2?: string;
  yellow: Line; red: Line; miss: Line; slow: Line;
}

// cada arma tem a sua mecânica (rules/mechanics.ts) e as suas falas, no falar do sertão
export const KIT: Record<Weapon, Kit> = {
  revolver: { label: 'Revólver', call: 'SAQUE!', btn: 'Atirar',
    aim: 'Atire quando o marcador passar na faixa amarela.',
    yellow: ['Arretado!', 'Bem na faixa amarela.'], red: ['Na mosca!', 'O revólver aprimorado garantiu a faixa vermelha.'],
    miss: ['Vixe!', 'O tiro saiu fora da faixa.'], slow: ['Lento!', 'O marcador chegou ao fim antes do tiro.'] },
  twin: { label: 'Duas pistolas', call: 'SAQUE DUPLO!', btn: 'Atirar',
    aim: 'Uma pistola em cada faixa amarela, na mesma passada.',
    yellow: ['Duplo!', 'Esquerda e direita certeiras.'], red: ['Duplo!', 'As duas acertaram, com ajuda do revólver aprimorado.'],
    miss: ['Vixe!', 'Uma das pistolas errou a faixa.'], slow: ['Lento!', 'O marcador passou antes do segundo tiro.'] },
  lasso: { label: 'Laço', call: 'LAÇA!', btn: 'Segure para girar',
    aim: 'Segure para girar o laço e solte na faixa amarela.',
    yellow: ['Laçado!', 'Amarrado feito bezerro em vaquejada.'], red: ['Laçado!', 'Laço frouxo, mas o revólver aprimorado deu confiança.'],
    miss: ['Vixe!', 'O laço caiu na poeira antes de chegar.'], slow: ['Lento!', 'Enquanto o laço girava, ele sacou.'] },
  pin: { label: 'Rolo de pão', call: 'AGORA, MENINO!', btn: 'Bater!',
    aim: 'Toque rápido para encher a barra de raiva!',
    yellow: ['PLAFT!', 'Rolo na testa: viu estrelinhas.'], red: ['PLAFT!', 'Rolo na testa: viu estrelinhas.'],
    miss: ['Vixe!', 'O rolo escorregou da mão.'], slow: ['Lento!', 'A raiva não encheu a tempo.'] },
  rifle: { label: 'Rifle', call: 'ENGATILHA!', btn: 'Engatilhar', btn2: 'Disparar',
    aim: 'Engatilhe o rifle primeiro!', aim2: 'Mira balançando: dispare na faixa amarela.',
    yellow: ['Certeiro!', 'O estampido ecoou no sertão inteiro.'], red: ['Acertou!', 'A mira tremeu, mas o revólver aprimorado segurou.'],
    miss: ['Vixe!', 'O tiro do rifle passou longe.'], slow: ['Lento!', 'Enquanto você mirava, ele sacou.'] },
};

// o que o bandido faz para tentar enganar o visitante antes do sino
export const BLUFFS = ['Ele mexeu os dedos perto da peixeira...', 'Um carcará piou lá no alto...', 'Um redemoinho de poeira cruzou o terreiro...', 'Um bode berrou no cercado...', 'A asa-branca passou voando...'];
