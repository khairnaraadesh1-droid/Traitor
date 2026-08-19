let audioContext: AudioContext | null = null;
let musicEnabled = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.1
): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* audio unavailable */
  }
}

export function setMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled;
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function playClick(): void {
  playTone(440, 0.08, "square", 0.05);
}

export function playJoin(): void {
  playTone(330, 0.15);
  setTimeout(() => playTone(440, 0.15), 100);
}

export function playRevealTraitor(): void {
  playTone(80, 0.8, "sawtooth", 0.15);
  setTimeout(() => playTone(60, 1, "sawtooth", 0.12), 200);
}

export function playRevealInnocent(): void {
  playTone(523, 0.3);
  setTimeout(() => playTone(659, 0.4), 150);
}

export function playNight(): void {
  playTone(110, 1.5, "triangle", 0.08);
}

export function playKill(): void {
  playTone(100, 0.5, "sawtooth", 0.12);
  setTimeout(() => playTone(70, 0.8, "sawtooth", 0.1), 300);
}

export function playVote(): void {
  playTone(392, 0.1, "square", 0.06);
}

export function playEliminate(): void {
  playTone(200, 0.4, "sawtooth", 0.1);
}

export function playWin(): void {
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.4, "sine", 0.1), i * 150);
  });
}

export function playLose(): void {
  [400, 350, 300, 200].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.5, "sawtooth", 0.08), i * 200);
  });
}

export function startAmbientDrone(): void {
  if (!musicEnabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = 55;
    filter.type = "lowpass";
    filter.frequency.value = 200;
    gain.gain.value = 0.03;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    (osc as OscillatorNode & { _ambient?: boolean })._ambient = true;
  } catch {
    /* ignore */
  }
}
