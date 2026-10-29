// ---------- Trilha: três climas compostos aqui mesmo, tocados pelo navegador (Web Audio) ----------
// cavalgada (enérgica) → vilarejo (calmo, violão e gaita) → duelo (tenso, assobio e sino)
// nada de gravação de terceiros: as notas abaixo são originais, sem licença a pedir

export type TrackName = 'ride' | 'village' | 'duel';
export type DuelFx = 'shot' | 'rifle' | 'cock' | 'whoosh' | 'throw' | 'snap' | 'tap' | 'bonk' | 'bell';

export interface VilaAudioOptions {
  /** som ligado ao abrir (o legado lia `vila-som`) */
  enabled: boolean;
  /** faixa licenciada para o duelo, no lugar da trilha sintetizada (opcional) */
  duelMusicUrl?: string | null;
  /** chamado quando o visitante liga ou desliga o som, para lembrar a escolha */
  persist?: (on: boolean) => void;
}

export interface VilaAudio {
  cue(name: TrackName, restart?: boolean): void;
  unlock(): Promise<void>;
  wind(): void;
  clop(vel: number): void;
  swell(dur: number): void;
  flap(): void;
  fx(name: DuelFx): void;
  finale(): void;
  setEnabled(on: boolean): void;
  readonly on: boolean;
  readonly live: boolean;
  readonly state: { want: TrackName | null; ctx: string; gain: number | null; tracks: Record<string, number> };
}

type Out = AudioNode;
interface TrackDef { vol: number; beat: number; beats: number; schedule(i: number, bt: number, out: Out): void }
interface Playing { def: TrackDef; bus: GainNode; bar: number; next: number; ending: boolean; el?: HTMLAudioElement }
type Mel = Record<number, [number, number, number][]>;

export function createVilaAudio(opts: VilaAudioOptions): VilaAudio {
  let ac: AudioContext | null = null;
  let master: GainNode, sfx: GainNode, verb: ConvolverNode, nb: AudioBuffer;
  let wind: GainNode | null = null;
  let enabled = opts.enabled;
  let want: TrackName | null = null;
  const playing: Partial<Record<TrackName, Playing>> = {};

  function impulse(seconds: number, decay: number): AudioBuffer {
    const len = ac!.sampleRate * seconds;
    const buf = ac!.createBuffer(2, len, ac!.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function noiseBuffer(seconds: number): AudioBuffer {
    const len = ac!.sampleRate * seconds;
    const buf = ac!.createBuffer(1, len, ac!.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function init(): void {
    if (ac) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return; // navegador sem Web Audio: segue em silêncio
    ac = new Ctor();
    master = ac.createGain(); master.gain.value = enabled ? 0.9 : 0;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.2;
    master.connect(limiter).connect(ac.destination);
    verb = ac.createConvolver(); verb.buffer = impulse(2.6, 2.4);
    const vg = ac.createGain(); vg.gain.value = 0.35; verb.connect(vg).connect(master);
    sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    nb = noiseBuffer(0.3);
    setInterval(pump, 120);
  }
  // ---- instrumentos ----
  function pluck(out: Out, time: number, freq: number, vel = 0.22, len = 1.1, bright = 9): void {
    const a = ac!;
    const o1 = a.createOscillator(), o2 = a.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'triangle';
    o1.frequency.value = freq; o2.frequency.value = freq * 1.003;
    const f = a.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(Math.min(5200, freq * bright), time);
    f.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.4), time + 0.35);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, time + len);
    o1.connect(f); o2.connect(f); f.connect(g).connect(out);
    o1.start(time); o2.start(time); o1.stop(time + len + 0.05); o2.stop(time + len + 0.05);
  }
  function twang(out: Out, time: number, freq: number, vel = 0.2): void {
    const a = ac!;
    const o = a.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq * 1.06, time); o.frequency.exponentialRampToValueAtTime(freq, time + 0.12);
    o.frequency.setValueAtTime(freq, time + 0.9); o.frequency.exponentialRampToValueAtTime(freq * 0.94, time + 2.2);
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, time); f.frequency.exponentialRampToValueAtTime(400, time + 1.6);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, time + 2.6);
    o.connect(f).connect(g).connect(out); g.connect(verb); o.start(time); o.stop(time + 2.7);
  }
  function whistle(out: Out, time: number, freq: number, dur: number, vel = 0.11): void {
    const a = ac!;
    const o = a.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq * 0.97, time); o.frequency.exponentialRampToValueAtTime(freq, time + 0.07);
    const lfo = a.createOscillator(); lfo.frequency.value = 5.6;
    const lg = a.createGain(); lg.gain.setValueAtTime(0, time);
    lg.gain.linearRampToValueAtTime(freq * 0.012, time + Math.min(0.4, dur * 0.6));
    lfo.connect(lg).connect(o.frequency);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.06);
    g.gain.setValueAtTime(vel, time + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.12);
    o.connect(g).connect(out);
    o.start(time); lfo.start(time); o.stop(time + dur + 0.2); lfo.stop(time + dur + 0.2);
  }
  // gaita: palheta com respiração e vibrato
  function harmonica(out: Out, time: number, freq: number, dur: number, vel = 0.05): void {
    const a = ac!;
    const o1 = a.createOscillator(), o2 = a.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = freq; o2.frequency.value = freq * 1.004;
    const lfo = a.createOscillator(); lfo.frequency.value = 5; const lg = a.createGain(); lg.gain.value = freq * 0.008; lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.1;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.09);
    g.gain.setValueAtTime(vel * 0.9, time + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
    o1.connect(f); o2.connect(f); f.connect(g).connect(out);
    [o1, o2, lfo].forEach((o) => { o.start(time); o.stop(time + dur + 0.2); });
  }
  function bass(out: Out, time: number, freq: number, dur = 0.5, vel = 0.32): void {
    const a = ac!;
    const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g).connect(out); o.start(time); o.stop(time + dur + 0.05);
  }
  function drum(out: Out, time: number, vel = 0.3, hi = 110): void {
    const a = ac!;
    const o = a.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(hi, time); o.frequency.exponentialRampToValueAtTime(48, time + 0.25);
    const g = a.createGain(); g.gain.setValueAtTime(vel, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
    o.connect(g).connect(out); o.start(time); o.stop(time + 0.45);
  }
  // bloco de madeira: o "pocotó" que empurra a cavalgada
  function block(out: Out, time: number, vel = 0.08): void {
    const a = ac!;
    const s = a.createBufferSource(); s.buffer = nb;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 4;
    const g = a.createGain(); g.gain.setValueAtTime(vel, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    s.connect(f).connect(g).connect(out); s.start(time); s.stop(time + 0.06);
  }
  // sino da igreja ao longe: parciais desafinadas
  function bell(out: Out, time: number, freq: number, vel = 0.07): void {
    const a = ac!;
    [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.9, 0.12]].forEach(([m, amp]) => {
      const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = freq * m;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel * amp, time + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, time + 3.5 / m + 0.6);
      o.connect(g).connect(out); g.connect(verb); o.start(time); o.stop(time + 4.2);
    });
  }
  function drone(out: Out, time: number, freq: number, dur: number, vel = 0.05): void {
    const a = ac!;
    const o = a.createOscillator(), o2 = a.createOscillator(); o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = freq; o2.frequency.value = freq * 1.5;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 340;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.linearRampToValueAtTime(vel, time + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, time + dur);
    o.connect(f); o2.connect(f); f.connect(g).connect(out); o.start(time); o2.start(time); o.stop(time + dur + 0.05); o2.stop(time + dur + 0.05);
  }

  const N = { E2: 82.41, G2: 98, A2: 110, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185, G3: 196, Gs3: 207.65, A3: 220, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392, Gs4: 415.3, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99, A5: 880 };

  // ---- A. cavalgada: menor, rápida, com o pocotó por baixo ----
  const RIDE_CH: Record<string, { bass: number; notes: number[] }> = {
    Am: { bass: N.A2, notes: [N.A2, N.E3, N.A3, N.C4, N.E4, N.C4] }, Dm: { bass: N.D3, notes: [N.D3, N.A3, N.D4, N.F4, N.D4, N.A3] },
    E: { bass: N.E2, notes: [N.E2, N.B2, N.E3, N.Gs3, N.B3, N.Gs3] }, F: { bass: N.F3 / 2, notes: [N.F3 / 2, N.C3, N.F3, N.A3, N.C4, N.A3] },
    G: { bass: N.G3 / 2, notes: [N.G3 / 2, N.D3, N.G3, N.B3, N.D4, N.B3] }, C: { bass: N.C3, notes: [N.C3, N.G3, N.C4, N.E4, N.G4, N.E4] },
  };
  const RIDE_FORM = ['Am', 'Am', 'Am', 'Am', 'Am', 'Dm', 'E', 'Am', 'F', 'G', 'C', 'E', 'Am', 'Dm', 'E', 'E'];
  const RIDE_MEL: Mel = {
    4: [[0, N.E5, 1], [1, N.A5, 1.5], [2.5, N.G5, 0.5], [3, N.E5, 1]], 5: [[0, N.F5, 1], [1, N.E5, 0.5], [1.5, N.D5, 0.5], [2, N.C5, 1], [3, N.D5, 1]],
    6: [[0, N.B4, 1], [1, N.C5, 0.5], [1.5, N.D5, 0.5], [2, N.E5, 2]], 7: [[0, N.A4, 2], [2, N.C5, 1], [3, N.E5, 1]],
    8: [[0, N.F5, 1.5], [1.5, N.E5, 0.5], [2, N.C5, 2]], 9: [[0, N.D5, 1.5], [1.5, N.B4, 0.5], [2, N.G4, 2]],
    10: [[0, N.E5, 1], [1, N.G5, 1], [2, N.C5, 2]], 11: [[0, N.B4, 2], [2, N.E5, 2]],
    12: [[0, N.E5, 1], [1, N.A5, 1.5], [2.5, N.G5, 0.5], [3, N.E5, 1]], 13: [[0, N.F5, 1], [1, N.E5, 0.5], [1.5, N.D5, 0.5], [2, N.C5, 1], [3, N.D5, 1]],
    14: [[0, N.B4, 1], [1, N.C5, 0.5], [1.5, N.D5, 0.5], [2, N.E5, 2]], 15: [[0, N.E5, 1], [1, N.Gs4, 1], [2, N.B4, 2]],
  };
  const RIDE: TrackDef = { vol: 0.75, beat: 60 / 104, beats: 4, schedule(i, bt, out) {
    const B = this.beat, idx = i % RIDE_FORM.length, c = RIDE_CH[RIDE_FORM[idx]];
    bass(out, bt, c.bass, B * 1.6); bass(out, bt + B * 2, c.bass, B * 1.4);
    if (idx >= 8) { drum(out, bt, 0.32); drum(out, bt + B * 2, 0.22); }
    for (let beat = 0; beat < 4; beat++) for (let k = 0; k < 3; k++) {
      const time = bt + beat * B + k * B / 3;
      pluck(out, time, c.notes[(beat * 3 + k) % c.notes.length], k === 0 ? 0.2 : 0.11, k === 0 ? 1.0 : 0.6);
      if (idx >= 4 && k !== 1) block(out, time, k === 0 ? 0.09 : 0.05);
    }
    (RIDE_MEL[idx] || []).forEach(([at, f, d]) => whistle(out, bt + at * B, f, d * B));
  } };

  // ---- B. vilarejo: valsa lenta em sol maior, violão dedilhado e gaita ao longe ----
  const VIL_CH: Record<string, number[]> = {
    G: [N.G2, N.B3, N.D4, N.G4], C: [N.C3, N.C4, N.E4, N.G4], D: [N.D3, N.A3, N.D4, N.Fs4], Em: [N.E2, N.B3, N.E4, N.G4], Am: [N.A2, N.A3, N.C4, N.E4],
  };
  const VIL_FORM = ['G', 'G', 'C', 'G', 'G', 'D', 'D', 'G', 'C', 'C', 'G', 'Em', 'Am', 'D', 'G', 'G'];
  const VIL_HARP: Mel = {
    4: [[0, N.B4, 1], [1, N.D5, 2]], 5: [[0, N.A4, 3]], 6: [[0, N.A4, 1], [1, N.D5, 1], [2, N.C5, 1]], 7: [[0, N.B4, 3]],
    12: [[0, N.E5, 1], [1, N.D5, 1], [2, N.C5, 1]], 13: [[0, N.A4, 2], [2, N.B4, 1]], 14: [[0, N.A4, 1.5], [1.5, N.G4, 1.5]], 15: [[0, N.G4, 3]],
  };
  const VIL_WHISTLE: Mel = { 8: [[0, N.E5, 2], [2, N.G5, 1]], 9: [[0, N.E5, 3]], 10: [[0, N.D5, 1.5], [1.5, N.B4, 1.5]], 11: [[0, N.B4, 3]] };
  const VILLAGE: TrackDef = { vol: 0.5, beat: 60 / 80, beats: 3, schedule(i, bt, out) {
    const B = this.beat, idx = i % VIL_FORM.length, ch = VIL_CH[VIL_FORM[idx]];
    pluck(out, bt, ch[0], 0.15, 1.6, 5);
    [1, 2].forEach((beat) => ch.slice(1).forEach((f, k) => pluck(out, bt + beat * B + k * 0.025, f, 0.05, 0.9, 6)));
    pluck(out, bt + 2.5 * B, ch[2], 0.035, 0.5, 6);
    (VIL_HARP[idx] || []).forEach(([at, f, d]) => harmonica(out, bt + at * B, f, d * B));
    (VIL_WHISTLE[idx] || []).forEach(([at, f, d]) => whistle(out, bt + at * B, f, d * B, 0.06));
  } };

  // ---- C. duelo: lá menor parado, sino, coração batendo e assobio solitário ----
  const DUEL_FORM = ['Am', 'Am', 'Dm', 'Am', 'F', 'E', 'Am', 'E'];
  const DUEL_ROOT: Record<string, number> = { Am: N.A2 / 2, Dm: N.D3 / 2, F: N.F3 / 4, E: N.E2 / 2 };
  const DUEL_MEL: Mel = {
    0: [[0, N.A4, 0.5], [0.5, N.E5, 2.5], [3, N.D5, 1]], 1: [[0, N.E5, 3.5]], 2: [[0, N.F5, 0.5], [0.5, N.E5, 0.5], [1, N.D5, 2.5]], 3: [[0, N.A4, 3.5]],
    5: [[0, N.Gs4, 1], [1, N.B4, 1], [2, N.E5, 2]], 6: [[0, N.A4, 0.5], [0.5, N.C5, 0.5], [1, N.E5, 2.5]], 7: [[0, N.E5, 1], [1, N.F5, 0.5], [1.5, N.E5, 2.5]],
  };
  const DUEL: TrackDef = { vol: 0.62, beat: 60 / 66, beats: 4, schedule(i, bt, out) {
    const B = this.beat, idx = i % DUEL_FORM.length, root = DUEL_ROOT[DUEL_FORM[idx]];
    drone(out, bt, root, B * 4.2, 0.06);
    for (let b = 0; b < 4; b++) { drum(out, bt + b * B, 0.18, 80); drum(out, bt + b * B + B * 0.28, 0.1, 70); }
    if (idx % 2 === 0) bell(out, bt, N.E4, 0.06);
    if (idx === 4 || idx === 7) twang(out, bt, idx === 4 ? N.F3 / 2 : N.E2, 0.16);
    (DUEL_MEL[idx] || []).forEach(([at, f, d]) => whistle(out, bt + at * B, f, d * B, 0.1));
  } };
  const TRACKS: Record<TrackName, TrackDef> = { ride: RIDE, village: VILLAGE, duel: DUEL };

  function pump(): void {
    if (!ac) return;
    Object.values(playing).forEach((tr) => {
      if (tr.ending) return;
      const barLen = tr.def.beat * tr.def.beats;
      while (tr.next < ac!.currentTime + 0.6) { tr.def.schedule(tr.bar++, tr.next, tr.bus); tr.next += barLen; }
    });
  }
  // se o site definir uma faixa de licença compatível para o duelo (environment.duelMusicUrl),
  // ela toca no lugar da trilha sintetizada (mesma transição, mesmo controle de volume e mudo)
  function startTrack(name: TrackName): void {
    const a = ac!;
    const def = TRACKS[name];
    const bus = a.createGain(); bus.gain.value = 0.0001; bus.connect(master);
    bus.gain.setTargetAtTime(def.vol, a.currentTime, 0.7);
    const url = name === 'duel' ? opts.duelMusicUrl : null;
    if (url) {
      const el = new window.Audio(url); el.loop = true; el.crossOrigin = 'anonymous';
      a.createMediaElementSource(el).connect(bus);
      el.play().catch(() => { /* sem a faixa: segue a trilha sintetizada */ const p = playing[name]; if (p) { delete p.el; p.ending = false; } });
      playing[name] = { def, bus, bar: 0, next: a.currentTime + 0.15, ending: true, el };
      return;
    }
    bus.connect(verb);
    playing[name] = { def, bus, bar: 0, next: a.currentTime + 0.15, ending: false };
  }
  function fadeOut(name: TrackName, tau = 0.6): void {
    const tr = playing[name]; if (!tr) return;
    delete playing[name];
    tr.ending = true;
    tr.bus.gain.cancelScheduledValues(ac!.currentTime);
    tr.bus.gain.setTargetAtTime(0.0001, ac!.currentTime, tau);
    setTimeout(() => { try { tr.bus.disconnect(); } catch { /* já desligado */ } if (tr.el) tr.el.pause(); }, tau * 6000 + 500);
  }
  function apply(restart: boolean): void {
    if (!ac) return;
    (Object.keys(playing) as TrackName[]).forEach((n) => { if (n !== want || restart) fadeOut(n); });
    if (want && !playing[want]) startTrack(want);
  }
  function startWind(): void {
    if (wind) return;
    const a = ac!;
    const s = a.createBufferSource(); s.buffer = noiseBuffer(4); s.loop = true;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.6;
    const lfo = a.createOscillator(); lfo.frequency.value = 0.18;
    const lg = a.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(f.frequency);
    const g = a.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.12, a.currentTime, 0.6);
    s.connect(f).connect(g).connect(master); s.start(); lfo.start();
    wind = g;
  }
  async function unlock(): Promise<void> {
    init();
    if (!ac) return;
    if (ac.state === 'suspended') { try { await ac.resume(); } catch { /* o navegador ainda não deixou */ } }
    apply(false);
  }
  return {
    // pede uma trilha; se o navegador ainda não liberou o som, ela começa no primeiro toque
    cue(name, restart = false) {
      if (want === name && !restart) return;
      want = name;
      if (ac) { apply(restart); if (wind) wind.gain.setTargetAtTime(name === 'ride' ? 0.12 : 0.04, ac.currentTime, 1.2); }
    },
    unlock,
    wind() { if (ac) startWind(); },
    clop(vel) {
      if (!ac || !enabled) return;
      const time = ac.currentTime + 0.01;
      const s = ac.createBufferSource(); s.buffer = nb;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800 + Math.random() * 400; f.Q.value = 1.3;
      const g = ac.createGain(); g.gain.setValueAtTime(vel, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
      s.connect(f).connect(g).connect(sfx); s.start(time); s.stop(time + 0.1);
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(55, time + 0.09);
      const g2 = ac.createGain(); g2.gain.setValueAtTime(vel * 0.9, time); g2.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
      o.connect(g2).connect(sfx); o.start(time); o.stop(time + 0.13);
    },
    swell(dur) {
      if (!ac || !enabled) return;
      const at = ac.currentTime;
      const s = ac.createBufferSource(); s.buffer = noiseBuffer(dur + 0.5);
      const f = ac.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(300, at); f.frequency.exponentialRampToValueAtTime(2200, at + dur * 0.8);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.26, at + dur * 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      s.connect(f).connect(g).connect(sfx); s.start(at); s.stop(at + dur + 0.1);
    },
    flap() {
      if (!ac || !enabled) return;
      for (let i = 0; i < 4; i++) {
        const time = ac.currentTime + i * 0.07;
        const s = ac.createBufferSource(); s.buffer = nb;
        const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200;
        const g = ac.createGain(); g.gain.setValueAtTime(0.18 - i * 0.03, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
        s.connect(f).connect(g).connect(sfx); s.start(time); s.stop(time + 0.08);
      }
    },
    // efeitos do duelo: cada arma tem o seu som (respeitam o mudo pelo volume geral)
    fx(name) {
      if (!ac || !enabled) return;
      const a = ac;
      const t = a.currentTime + 0.005;
      const noise = (at: number, type: BiquadFilterType, freq: number, q: number, vel: number, dec: number, wet?: boolean) => {
        const s = a.createBufferSource(); s.buffer = nb;
        const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const g = a.createGain(); g.gain.setValueAtTime(vel, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dec);
        s.connect(f).connect(g).connect(sfx); if (wet) g.connect(verb); s.start(at); s.stop(at + dec + 0.05);
      };
      const tone = (at: number, f0: number, f1: number, vel: number, dec: number, type: OscillatorType = 'sine') => {
        const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dec);
        const g = a.createGain(); g.gain.setValueAtTime(vel, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dec);
        o.connect(g).connect(sfx); o.start(at); o.stop(at + dec + 0.05);
      };
      if (name === 'shot') { noise(t, 'highpass', 900, 0.7, 0.5, 0.14, true); tone(t, 140, 40, 0.35, 0.16); }
      else if (name === 'rifle') { noise(t, 'lowpass', 2600, 0.6, 0.75, 0.3, true); tone(t, 100, 30, 0.5, 0.3); noise(t + 0.3, 'lowpass', 900, 0.6, 0.22, 0.4, true); noise(t + 0.62, 'lowpass', 700, 0.6, 0.1, 0.4, true); }
      else if (name === 'cock') { noise(t, 'bandpass', 3200, 5, 0.3, 0.03); noise(t + 0.11, 'bandpass', 2400, 5, 0.32, 0.04); }
      else if (name === 'whoosh') {
        const s = a.createBufferSource(); s.buffer = nb;
        const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(1500, t + 0.25);
        const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        s.connect(f).connect(g).connect(sfx); s.start(t); s.stop(t + 0.3);
      }
      else if (name === 'throw') { noise(t, 'bandpass', 900, 1.2, 0.2, 0.35); }
      else if (name === 'snap') { noise(t, 'highpass', 2200, 0.7, 0.35, 0.06); tone(t, 220, 90, 0.2, 0.12); }
      else if (name === 'tap') { tone(t, 190, 90, 0.14, 0.07); }
      else if (name === 'bonk') {
        tone(t, 320, 110, 0.4, 0.14, 'triangle');
        const o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(620, t + 0.05); o.frequency.exponentialRampToValueAtTime(260, t + 0.6);
        const lfo = a.createOscillator(); lfo.frequency.value = 14; const lg = a.createGain(); lg.gain.value = 40; lfo.connect(lg).connect(o.frequency);
        const g = a.createGain(); g.gain.setValueAtTime(0.0001, t + 0.05); g.gain.exponentialRampToValueAtTime(0.12, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
        o.connect(g).connect(sfx); o.start(t + 0.05); lfo.start(t + 0.05); o.stop(t + 0.7); lfo.stop(t + 0.7);
      }
      else if (name === 'bell') bell(sfx, t, N.E5, 0.08);
    },
    // fim da cavalgada: acorde final e a trilha da estrada se despede
    finale() {
      const tr = playing.ride;
      if (!ac || !tr) return;
      tr.ending = true;
      const now = ac.currentTime + 0.05, out = tr.bus;
      [N.A2, N.E3, N.A3, N.C4, N.E4, N.A4].forEach((f, i) => pluck(out, now + i * 0.035, f, 0.18, 3.4));
      whistle(out, now + 0.1, N.A5, RIDE.beat * 3, 0.09); bass(out, now, N.A2, 2.6); drum(out, now, 0.35);
      tr.bus.gain.setTargetAtTime(0.0001, now + 2.2, 0.6);
      if (want === 'ride') want = null;
    },
    // liga e desliga sem reiniciar a música: só o volume geral muda
    setEnabled(on) {
      enabled = on;
      opts.persist?.(on);
      if (on && !ac) { void unlock(); return; }
      if (!ac) return;
      if (on && ac.state === 'suspended') void ac.resume();
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.08);
    },
    get on() { return enabled; },
    get live() { return !!ac && ac.state === 'running'; },
    // só para conferir as transições: trilha pedida e trilhas tocando (com o compasso em que estão)
    get state() { return { want, ctx: ac ? ac.state : 'none', gain: ac ? master.gain.value : null, tracks: Object.fromEntries(Object.entries(playing).map(([k, t]) => [k, t.bar])) }; },
  };
}
