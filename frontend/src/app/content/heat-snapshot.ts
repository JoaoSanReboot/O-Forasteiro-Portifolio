// Registro guardado das contribuições (outubro de 2026): só o nível de cada dia, sem a contagem exata.
// A placa mostra isto enquanto a integração ao vivo (fase 5) não responde.

export interface HeatDay {
  date: string;
  level: number;
  count: number | null;
}

export interface HeatData {
  total: number;
  days: HeatDay[];
  live: boolean;
}

/** [coluna (semana), linha (dia), nível] dos dias com commit */
const HEAT: readonly (readonly [number, number, number])[] = [
  [1, 1, 3], [6, 2, 2], [6, 3, 2], [9, 2, 1], [11, 0, 1], [16, 2, 3], [16, 3, 3],
  [18, 2, 1], [19, 0, 2], [20, 0, 2], [20, 1, 2], [19, 4, 2], [28, 5, 3], [29, 4, 1], [38, 5, 2],
];
const HEAT_START = new Date(2025, 9, 26), HEAT_END = new Date(2026, 9, 26);

export const isoDay = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function snapshotData(): HeatData {
  const lv = new Map(HEAT.map(([c, r, l]) => [c * 7 + r, l]));
  const days: HeatDay[] = [];
  for (let i = 0; ; i++) {
    const d = new Date(HEAT_START); d.setDate(d.getDate() + i);
    if (d > HEAT_END) break;
    days.push({ date: isoDay(d), level: lv.get(i) || 0, count: null });
  }
  return { total: 24, days, live: false };
}
