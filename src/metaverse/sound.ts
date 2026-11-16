"use client";

// A small soundscape made in code (no audio files): wind through trees, birds now and
// then, and soft sounds for lighting lanterns and lamps. Starts only after a tap.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let windSrc: AudioBufferSourceNode | null = null;
let birdTimer: ReturnType<typeof setTimeout> | null = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  return ctx;
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02; // brown noise: soft, low
    d[i] = last * 3.5;
  }
  return b;
}

function bird() {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const notes = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < notes; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    const start = t + i * 0.16;
    const f = 2600 + Math.random() * 1400;
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * (1.2 + Math.random() * 0.4), start + 0.09);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.025, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + 0.14);
  }
  birdTimer = setTimeout(bird, 3500 + Math.random() * 7000);
}

export function setSound(on: boolean) {
  const c = ensure();
  if (on) {
    void c.resume();
    if (!windSrc) {
      windSrc = c.createBufferSource();
      windSrc.buffer = noiseBuffer(c, 6);
      windSrc.loop = true;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const g = c.createGain();
      g.gain.value = 0.16;
      windSrc.connect(lp).connect(g).connect(master!);
      windSrc.start();
      birdTimer = setTimeout(bird, 1500);
    }
    master!.gain.setTargetAtTime(1, c.currentTime, 0.4);
  } else if (master) {
    master.gain.setTargetAtTime(0, c.currentTime, 0.2);
  }
}

/** A soft bell, like a wind chime under the eaves. */
export function chime(pitch = 1) {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  for (const [mult, gain] of [
    [1, 0.08],
    [2.76, 0.03],
    [5.4, 0.012],
  ] as const) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = 660 * pitch * mult;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 2.5);
  }
}

/** A small metal tap, for the workshop. */
export function tap() {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(1800, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.2);
}

export function stopSound() {
  if (birdTimer) clearTimeout(birdTimer);
  birdTimer = null;
  windSrc?.stop();
  windSrc = null;
  void ctx?.close();
  ctx = null;
  master = null;
}
