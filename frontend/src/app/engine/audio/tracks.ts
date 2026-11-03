import { Instruments, Out } from './instruments';
import { NOTE as N } from './notes';

// ---------- Trilha: três climas compostos aqui mesmo, tocados pelo navegador (Web Audio) ----------
// cavalgada (enérgica) → vilarejo (calmo, violão e gaita) → duelo (tenso, assobio e sino)
// nada de gravação de terceiros: as notas abaixo são originais, sem licença a pedir

export type TrackName = 'ride' | 'village' | 'duel';

/** uma trilha em compassos: `schedule` agenda o compasso `i` a partir do instante `bt` */
export interface TrackDef { vol: number; beat: number; beats: number; schedule(i: number, bt: number, out: Out): void }

/** melodia por compasso: [tempo em batidas, nota, duração em batidas] */
type Melody = Record<number, [number, number, number][]>;

// ---- A. cavalgada: menor, rápida, com o pocotó por baixo ----
const RIDE_CHORDS: Record<string, { bass: number; notes: number[] }> = {
  Am: { bass: N.A2, notes: [N.A2, N.E3, N.A3, N.C4, N.E4, N.C4] }, Dm: { bass: N.D3, notes: [N.D3, N.A3, N.D4, N.F4, N.D4, N.A3] },
  E: { bass: N.E2, notes: [N.E2, N.B2, N.E3, N.Gs3, N.B3, N.Gs3] }, F: { bass: N.F3 / 2, notes: [N.F3 / 2, N.C3, N.F3, N.A3, N.C4, N.A3] },
  G: { bass: N.G3 / 2, notes: [N.G3 / 2, N.D3, N.G3, N.B3, N.D4, N.B3] }, C: { bass: N.C3, notes: [N.C3, N.G3, N.C4, N.E4, N.G4, N.E4] },
};
const RIDE_FORM = ['Am', 'Am', 'Am', 'Am', 'Am', 'Dm', 'E', 'Am', 'F', 'G', 'C', 'E', 'Am', 'Dm', 'E', 'E'];
const RIDE_MELODY: Melody = {
  4: [[0, N.E5, 1], [1, N.A5, 1.5], [2.5, N.G5, 0.5], [3, N.E5, 1]], 5: [[0, N.F5, 1], [1, N.E5, 0.5], [1.5, N.D5, 0.5], [2, N.C5, 1], [3, N.D5, 1]],
  6: [[0, N.B4, 1], [1, N.C5, 0.5], [1.5, N.D5, 0.5], [2, N.E5, 2]], 7: [[0, N.A4, 2], [2, N.C5, 1], [3, N.E5, 1]],
  8: [[0, N.F5, 1.5], [1.5, N.E5, 0.5], [2, N.C5, 2]], 9: [[0, N.D5, 1.5], [1.5, N.B4, 0.5], [2, N.G4, 2]],
  10: [[0, N.E5, 1], [1, N.G5, 1], [2, N.C5, 2]], 11: [[0, N.B4, 2], [2, N.E5, 2]],
  12: [[0, N.E5, 1], [1, N.A5, 1.5], [2.5, N.G5, 0.5], [3, N.E5, 1]], 13: [[0, N.F5, 1], [1, N.E5, 0.5], [1.5, N.D5, 0.5], [2, N.C5, 1], [3, N.D5, 1]],
  14: [[0, N.B4, 1], [1, N.C5, 0.5], [1.5, N.D5, 0.5], [2, N.E5, 2]], 15: [[0, N.E5, 1], [1, N.Gs4, 1], [2, N.B4, 2]],
};

// ---- B. vilarejo: valsa lenta em sol maior, violão dedilhado e gaita ao longe ----
const VILLAGE_CHORDS: Record<string, number[]> = {
  G: [N.G2, N.B3, N.D4, N.G4], C: [N.C3, N.C4, N.E4, N.G4], D: [N.D3, N.A3, N.D4, N.Fs4], Em: [N.E2, N.B3, N.E4, N.G4], Am: [N.A2, N.A3, N.C4, N.E4],
};
const VILLAGE_FORM = ['G', 'G', 'C', 'G', 'G', 'D', 'D', 'G', 'C', 'C', 'G', 'Em', 'Am', 'D', 'G', 'G'];
const VILLAGE_HARMONICA: Melody = {
  4: [[0, N.B4, 1], [1, N.D5, 2]], 5: [[0, N.A4, 3]], 6: [[0, N.A4, 1], [1, N.D5, 1], [2, N.C5, 1]], 7: [[0, N.B4, 3]],
  12: [[0, N.E5, 1], [1, N.D5, 1], [2, N.C5, 1]], 13: [[0, N.A4, 2], [2, N.B4, 1]], 14: [[0, N.A4, 1.5], [1.5, N.G4, 1.5]], 15: [[0, N.G4, 3]],
};
const VILLAGE_WHISTLE: Melody = { 8: [[0, N.E5, 2], [2, N.G5, 1]], 9: [[0, N.E5, 3]], 10: [[0, N.D5, 1.5], [1.5, N.B4, 1.5]], 11: [[0, N.B4, 3]] };

// ---- C. duelo: lá menor parado, sino, coração batendo e assobio solitário ----
const DUEL_FORM = ['Am', 'Am', 'Dm', 'Am', 'F', 'E', 'Am', 'E'];
const DUEL_ROOT: Record<string, number> = { Am: N.A2 / 2, Dm: N.D3 / 2, F: N.F3 / 4, E: N.E2 / 2 };
const DUEL_MELODY: Melody = {
  0: [[0, N.A4, 0.5], [0.5, N.E5, 2.5], [3, N.D5, 1]], 1: [[0, N.E5, 3.5]], 2: [[0, N.F5, 0.5], [0.5, N.E5, 0.5], [1, N.D5, 2.5]], 3: [[0, N.A4, 3.5]],
  5: [[0, N.Gs4, 1], [1, N.B4, 1], [2, N.E5, 2]], 6: [[0, N.A4, 0.5], [0.5, N.C5, 0.5], [1, N.E5, 2.5]], 7: [[0, N.E5, 1], [1, N.F5, 0.5], [1.5, N.E5, 2.5]],
};

export function createTracks(ins: Instruments): Record<TrackName, TrackDef> {
  const { pluck, whistle, harmonica, bass, drum, block, bell, drone, twang } = ins;
  const ride: TrackDef = { vol: 0.75, beat: 60 / 104, beats: 4, schedule(i, bt, out) {
    const B = this.beat, idx = i % RIDE_FORM.length, c = RIDE_CHORDS[RIDE_FORM[idx]];
    bass(out, bt, c.bass, B * 1.6); bass(out, bt + B * 2, c.bass, B * 1.4);
    if (idx >= 8) { drum(out, bt, 0.32); drum(out, bt + B * 2, 0.22); }
    for (let beat = 0; beat < 4; beat++) for (let k = 0; k < 3; k++) {
      const time = bt + beat * B + k * B / 3;
      pluck(out, time, c.notes[(beat * 3 + k) % c.notes.length], k === 0 ? 0.2 : 0.11, k === 0 ? 1.0 : 0.6);
      if (idx >= 4 && k !== 1) block(out, time, k === 0 ? 0.09 : 0.05);
    }
    (RIDE_MELODY[idx] || []).forEach(([at, f, d]) => whistle(out, bt + at * B, f, d * B));
  } };
  const village: TrackDef = { vol: 0.5, beat: 60 / 80, beats: 3, schedule(i, bt, out) {
    const B = this.beat, idx = i % VILLAGE_FORM.length, ch = VILLAGE_CHORDS[VILLAGE_FORM[idx]];
    pluck(out, bt, ch[0], 0.15, 1.6, 5);
    [1, 2].forEach((beat) => ch.slice(1).forEach((f, k) => pluck(out, bt + beat * B + k * 0.025, f, 0.05, 0.9, 6)));
    pluck(out, bt + 2.5 * B, ch[2], 0.035, 0.5, 6);
    (VILLAGE_HARMONICA[idx] || []).forEach(([at, f, d]) => harmonica(out, bt + at * B, f, d * B));
    (VILLAGE_WHISTLE[idx] || []).forEach(([at, f, d]) => whistle(out, bt + at * B, f, d * B, 0.06));
  } };
  const duel: TrackDef = { vol: 0.62, beat: 60 / 66, beats: 4, schedule(i, bt, out) {
    const B = this.beat, idx = i % DUEL_FORM.length, root = DUEL_ROOT[DUEL_FORM[idx]];
    drone(out, bt, root, B * 4.2, 0.06);
    for (let b = 0; b < 4; b++) { drum(out, bt + b * B, 0.18, 80); drum(out, bt + b * B + B * 0.28, 0.1, 70); }
    if (idx % 2 === 0) bell(out, bt, N.E4, 0.06);
    if (idx === 4 || idx === 7) twang(out, bt, idx === 4 ? N.F3 / 2 : N.E2, 0.16);
    (DUEL_MELODY[idx] || []).forEach(([at, f, d]) => whistle(out, bt + at * B, f, d * B, 0.1));
  } };
  return { ride, village, duel };
}

/** fim da cavalgada: acorde final, assobio longo e o bumbo, no barramento da trilha da estrada */
export function scheduleRideFinale(ins: Instruments, out: Out, now: number, rideBeat: number): void {
  [N.A2, N.E3, N.A3, N.C4, N.E4, N.A4].forEach((f, i) => ins.pluck(out, now + i * 0.035, f, 0.18, 3.4));
  ins.whistle(out, now + 0.1, N.A5, rideBeat * 3, 0.09); ins.bass(out, now, N.A2, 2.6); ins.drum(out, now, 0.35);
}
