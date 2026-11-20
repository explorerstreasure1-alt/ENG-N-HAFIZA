const AudioContext =
  (typeof window !== "undefined"
    ? (window as typeof window & { AudioContext?: AudioContext; webkitAudioContext?: AudioContext })
    : undefined)?.AudioContext ??
  (typeof window !== "undefined"
    ? (window as typeof window & { AudioContext?: AudioContext; webkitAudioContext?: AudioContext })
    : undefined)?.webkitAudioContext;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined" || !AudioContext) return null;
  if (!ctx) ctx = new (AudioContext as any)();
  return ctx;
}

export function initSound() {
  if (typeof window === "undefined") return;
  const c = getCtx();
  if (c && c.state === "suspended") {
    c.resume().catch(() => undefined);
  }
}

function tone(
  freq: number,
  type: OscillatorType = "sine",
  duration: number = 0.1,
  volume: number = 0.12,
  when: number = 0,
) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, now);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), now + duration);
  g.gain.setValueAtTime(volume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);
  o.connect(g);
  g.connect(c.destination);
  o.start(now);
  o.stop(now + duration + 0.05);
}

export function playClick() {
  tone(900, "sine", 0.06, 0.1);
}

export function playPop() {
  tone(1400, "sine", 0.1, 0.15);
}

export function playSuccess() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  [660, 780, 990].forEach((f, i) => tone(f, "sine", 0.12, 0.1, i * 0.05));
}

export function playError() {
  tone(220, "sawtooth", 0.2, 0.15);
}
