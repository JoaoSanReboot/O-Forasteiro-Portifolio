// O ritmo do duelo: uma dificuldade só, e cada bandido preso deixa o próximo mais rápido

export interface Level { period: number; zone: number; perfect: number; speedUp: number; mashNeed: number; mashTime: number }

/** tempo do marcador (ms), faixa vermelha e amarela (% da barra), quanto acelera por bandido e o fôlego da raiva (rolo) */
export const LEVEL: Level = { period: 1450, zone: 24, perfect: 10, speedUp: 0.93, mashNeed: 10, mashTime: 2400 };
