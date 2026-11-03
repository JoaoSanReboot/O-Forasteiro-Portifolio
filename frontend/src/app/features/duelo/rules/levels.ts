// As três dificuldades do duelo

export type LevelId = 'facil' | 'normal' | 'dificil';
export interface Level { name: string; wins: number; period: number; zone: number; perfect: number; speedUp: number; mashNeed: number; mashTime: number }

// tempo do marcador (ms), faixa vermelha e amarela (% da barra), rodadas para vencer e o fôlego da raiva (rolo)
export const LEVELS: Record<LevelId, Level> = {
  facil: { name: 'Fácil', wins: 2, period: 1700, zone: 28, perfect: 12, speedUp: 0.97, mashNeed: 8, mashTime: 2700 },
  normal: { name: 'Normal', wins: 3, period: 1250, zone: 20, perfect: 8, speedUp: 0.95, mashNeed: 11, mashTime: 2200 },
  dificil: { name: 'Difícil', wins: 4, period: 900, zone: 13, perfect: 5, speedUp: 0.94, mashNeed: 14, mashTime: 1800 },
};
export const LEVEL_IDS = Object.keys(LEVELS) as LevelId[];
