// A mesa de som: saída geral com limitador, reverberação, o canal dos efeitos e o ruído que os percussivos usam

export interface AudioRig {
  readonly ac: AudioContext;
  /** volume geral: é ele que o alto-falante liga e desliga */
  readonly master: GainNode;
  /** canal dos efeitos (cascos, papel, armas) */
  readonly sfx: GainNode;
  readonly verb: ConvolverNode;
  /** ruído curto e reaproveitado (pocotó, cascos, papel, armas) */
  readonly noise: AudioBuffer;
}

export function noiseBuffer(ac: AudioContext, seconds: number): AudioBuffer {
  const len = ac.sampleRate * seconds;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function impulse(ac: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = ac.sampleRate * seconds;
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return buf;
}

/** monta a mesa num AudioContext novo; `enabled` é o alto-falante ao abrir */
export function createRig(ac: AudioContext, enabled: boolean): AudioRig {
  const master = ac.createGain(); master.gain.value = enabled ? 0.9 : 0;
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -10; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.2;
  master.connect(limiter).connect(ac.destination);
  const verb = ac.createConvolver(); verb.buffer = impulse(ac, 2.6, 2.4);
  const vg = ac.createGain(); vg.gain.value = 0.35; verb.connect(vg).connect(master);
  const sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
  const noise = noiseBuffer(ac, 0.3);
  return { ac, master, sfx, verb, noise };
}
