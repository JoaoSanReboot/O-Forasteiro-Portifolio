import { Instruments } from './instruments';
import { NOTE as N } from './notes';
import { AudioRig, noiseBuffer } from './rig';

// Efeitos: cascos, vento, rajada de poeira, papel batendo e as armas do duelo (todos no canal de efeitos)
export type DuelFx = 'shot' | 'rifle' | 'cock' | 'whoosh' | 'throw' | 'snap' | 'tap' | 'bonk' | 'bell';

/** um casco na terra: estalo filtrado e o baque grave */
export function clop({ ac, sfx, noise }: AudioRig, vel: number): void {
  const time = ac.currentTime + 0.01;
  const s = ac.createBufferSource(); s.buffer = noise;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800 + Math.random() * 400; f.Q.value = 1.3;
  const g = ac.createGain(); g.gain.setValueAtTime(vel, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
  s.connect(f).connect(g).connect(sfx); s.start(time); s.stop(time + 0.1);
  const o = ac.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(55, time + 0.09);
  const g2 = ac.createGain(); g2.gain.setValueAtTime(vel * 0.9, time); g2.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
  o.connect(g2).connect(sfx); o.start(time); o.stop(time + 0.13);
}

/** a rajada de poeira que cresce até a névoa */
export function swell({ ac, sfx }: AudioRig, dur: number): void {
  const at = ac.currentTime;
  const s = ac.createBufferSource(); s.buffer = noiseBuffer(ac, dur + 0.5);
  const f = ac.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(300, at); f.frequency.exponentialRampToValueAtTime(2200, at + dur * 0.8);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.26, at + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(sfx); s.start(at); s.stop(at + dur + 0.1);
}

/** o cartaz batendo no vento */
export function flap({ ac, sfx, noise }: AudioRig): void {
  for (let i = 0; i < 4; i++) {
    const time = ac.currentTime + i * 0.07;
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200;
    const g = ac.createGain(); g.gain.setValueAtTime(0.18 - i * 0.03, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    s.connect(f).connect(g).connect(sfx); s.start(time); s.stop(time + 0.08);
  }
}

/** vento contínuo do sertão; devolve o volume dele, que a trilha abaixa fora da estrada */
export function startWind({ ac, master }: AudioRig): GainNode {
  const s = ac.createBufferSource(); s.buffer = noiseBuffer(ac, 4); s.loop = true;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.6;
  const lfo = ac.createOscillator(); lfo.frequency.value = 0.18;
  const lg = ac.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(f.frequency);
  const g = ac.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.12, ac.currentTime, 0.6);
  s.connect(f).connect(g).connect(master); s.start(); lfo.start();
  return g;
}

/** efeitos do duelo: cada arma tem o seu som */
export function duelFx({ ac: a, sfx, verb, noise: nb }: AudioRig, ins: Instruments, name: DuelFx): void {
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
  else if (name === 'bell') ins.bell(sfx, t, N.E5, 0.08);
}
