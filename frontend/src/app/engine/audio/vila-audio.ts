import { clop, duelFx, DuelFx, flap, startWind, swell } from './effects';
import { createInstruments, Instruments } from './instruments';
import { AudioRig, createRig } from './rig';
import { createTracks, scheduleRideFinale, TrackDef, TrackName } from './tracks';

// O motor de áudio da vila: libera o som no primeiro gesto, agenda as trilhas compasso a compasso e faz as transições.
// Os instrumentos, as trilhas e os efeitos moram cada um no seu arquivo; aqui fica só a orquestração.

export type { DuelFx } from './effects';
export type { TrackName } from './tracks';

export interface VilaAudioOptions {
  /** som ligado ao abrir (o AudioService lê `vila-som`) */
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

interface Playing { def: TrackDef; bus: GainNode; bar: number; next: number; ending: boolean; el?: HTMLAudioElement }

/** de quanto em quanto tempo (ms) os próximos compassos são agendados, e quanto (s) à frente */
const PUMP_MS = 120;
const LOOKAHEAD = 0.6;

export function createVilaAudio(opts: VilaAudioOptions): VilaAudio {
  let rig: AudioRig | null = null;
  let ins: Instruments;
  let tracks: Record<TrackName, TrackDef>;
  let wind: GainNode | null = null;
  let enabled = opts.enabled;
  let want: TrackName | null = null;
  const playing: Partial<Record<TrackName, Playing>> = {};

  function init(): void {
    if (rig) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return; // navegador sem Web Audio: segue em silêncio
    rig = createRig(new Ctor(), enabled);
    ins = createInstruments(rig);
    tracks = createTracks(ins);
    setInterval(pump, PUMP_MS);
  }

  function pump(): void {
    if (!rig) return;
    const { ac } = rig;
    Object.values(playing).forEach((tr) => {
      if (tr.ending) return;
      const barLen = tr.def.beat * tr.def.beats;
      while (tr.next < ac.currentTime + LOOKAHEAD) { tr.def.schedule(tr.bar++, tr.next, tr.bus); tr.next += barLen; }
    });
  }

  // se o site definir uma faixa de licença compatível para o duelo (environment.duelMusicUrl),
  // ela toca no lugar da trilha sintetizada (mesma transição, mesmo controle de volume e mudo)
  function startTrack(name: TrackName): void {
    const { ac: a, master, verb } = rig!;
    const def = tracks[name];
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
    const { ac } = rig!;
    delete playing[name];
    tr.ending = true;
    tr.bus.gain.cancelScheduledValues(ac.currentTime);
    tr.bus.gain.setTargetAtTime(0.0001, ac.currentTime, tau);
    setTimeout(() => { try { tr.bus.disconnect(); } catch { /* já desligado */ } if (tr.el) tr.el.pause(); }, tau * 6000 + 500);
  }

  function apply(restart: boolean): void {
    if (!rig) return;
    (Object.keys(playing) as TrackName[]).forEach((n) => { if (n !== want || restart) fadeOut(n); });
    if (want && !playing[want]) startTrack(want);
  }

  async function unlock(): Promise<void> {
    init();
    if (!rig) return;
    if (rig.ac.state === 'suspended') { try { await rig.ac.resume(); } catch { /* o navegador ainda não deixou */ } }
    apply(false);
  }

  /** efeitos só tocam com o som liberado e ligado */
  const live = (): AudioRig | null => (rig && enabled ? rig : null);

  return {
    // pede uma trilha; se o navegador ainda não liberou o som, ela começa no primeiro toque
    cue(name, restart = false) {
      if (want === name && !restart) return;
      want = name;
      if (rig) { apply(restart); if (wind) wind.gain.setTargetAtTime(name === 'ride' ? 0.12 : 0.04, rig.ac.currentTime, 1.2); }
    },
    unlock,
    wind() { if (rig && !wind) wind = startWind(rig); },
    clop(vel) { const r = live(); if (r) clop(r, vel); },
    swell(dur) { const r = live(); if (r) swell(r, dur); },
    flap() { const r = live(); if (r) flap(r); },
    // efeitos do duelo (respeitam o mudo pelo volume geral)
    fx(name) { const r = live(); if (r) duelFx(r, ins, name); },
    // fim da cavalgada: acorde final e a trilha da estrada se despede
    finale() {
      const tr = playing.ride;
      if (!rig || !tr) return;
      tr.ending = true;
      const now = rig.ac.currentTime + 0.05;
      scheduleRideFinale(ins, tr.bus, now, tracks.ride.beat);
      tr.bus.gain.setTargetAtTime(0.0001, now + 2.2, 0.6);
      if (want === 'ride') want = null;
    },
    // liga e desliga sem reiniciar a música: só o volume geral muda
    setEnabled(on) {
      enabled = on;
      opts.persist?.(on);
      if (on && !rig) { void unlock(); return; }
      if (!rig) return;
      const { ac, master } = rig;
      if (on && ac.state === 'suspended') void ac.resume();
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.08);
    },
    get on() { return enabled; },
    get live() { return !!rig && rig.ac.state === 'running'; },
    // só para conferir as transições: trilha pedida e trilhas tocando (com o compasso em que estão)
    get state() { return { want, ctx: rig ? rig.ac.state : 'none', gain: rig ? rig.master.gain.value : null, tracks: Object.fromEntries(Object.entries(playing).map(([k, t]) => [k, t.bar])) }; },
  };
}
