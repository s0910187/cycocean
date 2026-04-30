export class RitualAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  muted = false;

  init() {
    if (this.ctx) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
    this.startMusic();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.16;
  }

  sfx(name: "click" | "card" | "hit" | "block" | "reward" | "danger" | "none") {
    if (name === "none") return;
    this.init();
    if (!this.ctx || this.muted) return;
    if (name === "click") this.tone(520, 0.035, "triangle", 0.025);
    if (name === "card") {
      this.tone(410, 0.07, "triangle", 0.07);
      this.tone(210, 0.08, "square", 0.025, 0.03);
    }
    if (name === "hit") {
      this.tone(90, 0.11, "sawtooth", 0.08);
      this.tone(58, 0.18, "sine", 0.06);
    }
    if (name === "block") {
      this.tone(330, 0.14, "triangle", 0.055);
      this.tone(495, 0.13, "sine", 0.025, 0.05);
    }
    if (name === "reward") {
      this.tone(330, 0.09, "triangle", 0.045);
      this.tone(440, 0.1, "triangle", 0.045, 0.09);
      this.tone(660, 0.15, "triangle", 0.04, 0.19);
    }
    if (name === "danger") this.tone(110, 0.32, "sawtooth", 0.07);
  }

  private tone(freq: number, duration = 0.18, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private startMusic() {
    if (this.timer) return;
    const notes = [196, 220, 247, 294, 330, 392];
    const pulse = () => {
      if (!this.ctx || this.muted) return;
      const base = [65.4, 73.4, 82.4][Math.floor(Math.random() * 3)];
      const note = notes[Math.floor(Math.random() * notes.length)];
      this.tone(base, 1.9, "sine", 0.022);
      this.tone(note, 0.16, "triangle", 0.032, 0.1);
      if (Math.random() > 0.55) this.tone(note * 2, 0.08, "sine", 0.022, 0.42);
    };
    pulse();
    this.timer = window.setInterval(pulse, 2400);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
