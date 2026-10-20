let ctx: AudioContext | null = null;
let ctxFailed = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined" || ctxFailed) return null;
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        ctxFailed = true;
        return null;
      }
      ctx = new Ctor();
    } catch {
      ctxFailed = true;
      return null;
    }
  }
  return ctx;
}

export function unlockAudio() {
  try {
    const audio = getCtx();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => {});
  } catch {
    ctxFailed = true;
  }
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.05, delay = 0) {
  try {
    const audio = getCtx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(audio.destination);
    const t = audio.currentTime + delay;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch {
    /* Autoplay / iframe AudioContext restrictions must not crash the hall. */
  }
}

export function playCorrect() {
  unlockAudio();
  tone(523.25, 0.12, "triangle", 0.04);
  tone(659.25, 0.16, "triangle", 0.035, 0.07);
}

export function playWrong() {
  unlockAudio();
  tone(180, 0.18, "sawtooth", 0.03);
}

export function playCombo() {
  unlockAudio();
  tone(523.25, 0.08, "square", 0.03);
  tone(659.25, 0.08, "square", 0.03, 0.06);
  tone(783.99, 0.14, "square", 0.035, 0.12);
}

export function playLevel() {
  unlockAudio();
  tone(392, 0.12, "triangle", 0.04);
  tone(523.25, 0.12, "triangle", 0.04, 0.1);
  tone(659.25, 0.12, "triangle", 0.04, 0.2);
  tone(783.99, 0.22, "triangle", 0.045, 0.3);
}

export function playCrate() {
  unlockAudio();
  tone(392, 0.1, "square", 0.03);
  tone(523.25, 0.1, "square", 0.035, 0.08);
  tone(659.25, 0.1, "square", 0.04, 0.16);
  tone(783.99, 0.12, "triangle", 0.045, 0.24);
  tone(1046.5, 0.22, "triangle", 0.05, 0.34);
}

export function playCheckIn() {
  unlockAudio();
  tone(440, 0.1, "sine", 0.035);
  tone(554.37, 0.16, "sine", 0.04, 0.09);
}
