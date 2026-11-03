import { AudioRig } from './rig';

// Os instrumentos sintetizados: cada um agenda as suas notas no instante pedido e se desliga sozinho
export type Out = AudioNode;

export interface Instruments {
  /** violão dedilhado */
  pluck(out: Out, time: number, freq: number, vel?: number, len?: number, bright?: number): void;
  /** guitarra com vibrato (o "twang" do duelo) */
  twang(out: Out, time: number, freq: number, vel?: number): void;
  whistle(out: Out, time: number, freq: number, dur: number, vel?: number): void;
  /** gaita: palheta com respiração e vibrato */
  harmonica(out: Out, time: number, freq: number, dur: number, vel?: number): void;
  bass(out: Out, time: number, freq: number, dur?: number, vel?: number): void;
  drum(out: Out, time: number, vel?: number, hi?: number): void;
  /** bloco de madeira: o "pocotó" que empurra a cavalgada */
  block(out: Out, time: number, vel?: number): void;
  /** sino da igreja ao longe: parciais desafinadas */
  bell(out: Out, time: number, freq: number, vel?: number): void;
  drone(out: Out, time: number, freq: number, dur: number, vel?: number): void;
}

export function createInstruments({ ac: a, verb, noise }: AudioRig): Instruments {
  return {
    pluck(out, time, freq, vel = 0.22, len = 1.1, bright = 9) {
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
    },
    twang(out, time, freq, vel = 0.2) {
      const o = a.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq * 1.06, time); o.frequency.exponentialRampToValueAtTime(freq, time + 0.12);
      o.frequency.setValueAtTime(freq, time + 0.9); o.frequency.exponentialRampToValueAtTime(freq * 0.94, time + 2.2);
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, time); f.frequency.exponentialRampToValueAtTime(400, time + 1.6);
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, time + 2.6);
      o.connect(f).connect(g).connect(out); g.connect(verb); o.start(time); o.stop(time + 2.7);
    },
    whistle(out, time, freq, dur, vel = 0.11) {
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
    },
    harmonica(out, time, freq, dur, vel = 0.05) {
      const o1 = a.createOscillator(), o2 = a.createOscillator();
      o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = freq; o2.frequency.value = freq * 1.004;
      const lfo = a.createOscillator(); lfo.frequency.value = 5; const lg = a.createGain(); lg.gain.value = freq * 0.008; lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.1;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.09);
      g.gain.setValueAtTime(vel * 0.9, time + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
      o1.connect(f); o2.connect(f); f.connect(g).connect(out);
      [o1, o2, lfo].forEach((o) => { o.start(time); o.stop(time + dur + 0.2); });
    },
    bass(out, time, freq, dur = 0.5, vel = 0.32) {
      const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g).connect(out); o.start(time); o.stop(time + dur + 0.05);
    },
    drum(out, time, vel = 0.3, hi = 110) {
      const o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(hi, time); o.frequency.exponentialRampToValueAtTime(48, time + 0.25);
      const g = a.createGain(); g.gain.setValueAtTime(vel, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
      o.connect(g).connect(out); o.start(time); o.stop(time + 0.45);
    },
    block(out, time, vel = 0.08) {
      const s = a.createBufferSource(); s.buffer = noise;
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 4;
      const g = a.createGain(); g.gain.setValueAtTime(vel, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      s.connect(f).connect(g).connect(out); s.start(time); s.stop(time + 0.06);
    },
    bell(out, time, freq, vel = 0.07) {
      [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.9, 0.12]].forEach(([m, amp]) => {
        const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = freq * m;
        const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel * amp, time + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, time + 3.5 / m + 0.6);
        o.connect(g).connect(out); g.connect(verb); o.start(time); o.stop(time + 4.2);
      });
    },
    drone(out, time, freq, dur, vel = 0.05) {
      const o = a.createOscillator(), o2 = a.createOscillator(); o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = freq; o2.frequency.value = freq * 1.5;
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 340;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, time); g.gain.linearRampToValueAtTime(vel, time + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, time + dur);
      o.connect(f); o2.connect(f); f.connect(g).connect(out); o.start(time); o2.start(time); o.stop(time + dur + 0.05); o2.stop(time + dur + 0.05);
    },
  };
}
