const bgmUrl = new URL("../../assets/audio/bgm/tide-deck-vigil.mp3", import.meta.url).href;
const impactUrl = new URL("../../assets/audio/sfx/impact-body.wav", import.meta.url).href;
const chargeUrl = new URL("../../assets/audio/sfx/charge-qigong.mp3", import.meta.url).href;
const fireUrl = new URL("../../assets/audio/sfx/fire-burst.mp3", import.meta.url).href;
const lightningUrl = new URL("../../assets/audio/sfx/lightning-hit.mp3", import.meta.url).href;

type MusicMode = "title" | "game" | "victory" | "gameover";
type SfxName = "click" | "card" | "hit" | "impact" | "fire" | "lightning" | "charge" | "block" | "reward" | "danger" | "none";

export class RitualAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgm: HTMLAudioElement | null = null;
  private clips: Partial<Record<SfxName, HTMLAudioElement>> = {};
  private mode: MusicMode = "title";
  private timer: number | null = null;
  private jingleTimer: number | null = null;
  muted = false;

  init() {
    if (this.ctx) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
    this.prepareClips();
    this.prepareBgm();
    this.ctx.resume?.().catch(() => undefined);
    this.playBgm();
  }

  setMusicMode(mode: MusicMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === "victory") {
      this.bgm?.pause();
      this.clearJingle();
      this.playVictoryJingle();
    } else if (mode === "gameover") {
      this.bgm?.pause();
      this.clearJingle();
      this.playGameoverJingle();
    } else {
      this.clearJingle();
      this.updateBgmVolume();
      this.playBgm();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.16;
    this.updateBgmVolume();
    if (muted) this.bgm?.pause();
    else if (this.mode !== "victory" && this.mode !== "gameover") this.playBgm();
  }

  sfx(name: SfxName) {
    if (name === "none") return;
    this.init();
    if (!this.ctx || this.muted) return;
    this.ctx.resume?.().catch(() => undefined);
    if (name === "impact" || name === "hit") {
      this.playClip("impact", 0.64);
      return;
    }
    if (name === "fire") {
      this.playClip("fire", 0.52);
      return;
    }
    if (name === "lightning") {
      this.playClip("lightning", 0.5);
      return;
    }
    if (name === "charge" || name === "block" || name === "card") {
      this.playClip("charge", name === "card" ? 0.22 : 0.34);
      return;
    }
    if (name === "click") this.tone(520, 0.035, "triangle", 0.025);
    if (name === "reward") {
      this.tone(330, 0.09, "triangle", 0.045);
      this.tone(440, 0.1, "triangle", 0.045, 0.09);
      this.tone(660, 0.15, "triangle", 0.04, 0.19);
    }
    if (name === "danger") this.tone(110, 0.32, "sawtooth", 0.07);
  }

  private playVictoryJingle() {
    if (!this.ctx || this.muted) return;
    // 上升大調音階，歡快勝利感
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    const delays = [0, 0.15, 0.30, 0.48, 0.65, 0.80, 0.95];
    notes.forEach((freq, i) => {
      this.tone(freq, i === notes.length - 1 ? 1.2 : 0.22, "triangle", 0.09, delays[i]);
    });
  }

  private playGameoverJingle() {
    if (!this.ctx || this.muted) return;
    // 下降小調，沉重失敗感
    const notes = [392, 349, 311, 262, 220];
    const delays = [0, 0.3, 0.6, 0.95, 1.3];
    notes.forEach((freq, i) => {
      this.tone(freq, i === notes.length - 1 ? 1.8 : 0.4, "sine", 0.07, delays[i]);
    });
  }

  private clearJingle() {
    if (this.jingleTimer) {
      window.clearTimeout(this.jingleTimer);
      this.jingleTimer = null;
    }
  }

  private prepareClips() {
    if (this.clips.impact) return;
    this.clips = {
      impact: new Audio(impactUrl),
      fire: new Audio(fireUrl),
      lightning: new Audio(lightningUrl),
      charge: new Audio(chargeUrl),
    };
    Object.values(this.clips).forEach((clip) => {
      if (!clip) return;
      clip.preload = "auto";
    });
  }

  private prepareBgm() {
    if (this.bgm) return;
    this.bgm = new Audio(bgmUrl);
    this.bgm.loop = true;
    this.bgm.preload = "auto";
    this.updateBgmVolume();
  }

  private updateBgmVolume() {
    if (!this.bgm) return;
    this.bgm.volume = this.muted ? 0 : this.mode === "title" ? 0.44 : 0.16;
  }

  private playBgm() {
    if (!this.bgm || this.muted) return;
    this.bgm.play().catch(() => undefined);
  }

  private playClip(name: "impact" | "fire" | "lightning" | "charge", volume: number) {
    const source = this.clips[name];
    if (!source) return;
    const clip = source.cloneNode(true) as HTMLAudioElement;
    clip.volume = volume;
    clip.play().catch(() => undefined);
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
type SfxName = "click" | "card" | "hit" | "impact" | "fire" | "lightning" | "charge" | "block" | "reward" | "danger" | "none";

export class RitualAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgm: HTMLAudioElement | null = null;
  private clips: Partial<Record<SfxName, HTMLAudioElement>> = {};
  private mode: MusicMode = "title";
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
    this.prepareClips();
    this.prepareBgm();
    this.ctx.resume?.().catch(() => undefined);
    this.playBgm();
  }

  setMusicMode(mode: MusicMode) {
    this.mode = mode;
    this.updateBgmVolume();
    this.playBgm();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.16;
    this.updateBgmVolume();
    if (muted) this.bgm?.pause();
    else this.playBgm();
  }

  sfx(name: SfxName) {
    if (name === "none") return;
    this.init();
    if (!this.ctx || this.muted) return;
    this.ctx.resume?.().catch(() => undefined);
    if (name === "impact" || name === "hit") {
      this.playClip("impact", 0.64);
      return;
    }
    if (name === "fire") {
      this.playClip("fire", 0.52);
      return;
    }
    if (name === "lightning") {
      this.playClip("lightning", 0.5);
      return;
    }
    if (name === "charge" || name === "block" || name === "card") {
      this.playClip("charge", name === "card" ? 0.22 : 0.34);
      return;
    }
    if (name === "click") this.tone(520, 0.035, "triangle", 0.025);
    if (name === "reward") {
      this.tone(330, 0.09, "triangle", 0.045);
      this.tone(440, 0.1, "triangle", 0.045, 0.09);
      this.tone(660, 0.15, "triangle", 0.04, 0.19);
    }
    if (name === "danger") this.tone(110, 0.32, "sawtooth", 0.07);
  }

  private prepareClips() {
    if (this.clips.impact) return;
    this.clips = {
      impact: new Audio(impactUrl),
      fire: new Audio(fireUrl),
      lightning: new Audio(lightningUrl),
      charge: new Audio(chargeUrl),
    };
    Object.values(this.clips).forEach((clip) => {
      if (!clip) return;
      clip.preload = "auto";
    });
  }

  private prepareBgm() {
    if (this.bgm) return;
    this.bgm = new Audio(bgmUrl);
    this.bgm.loop = true;
    this.bgm.preload = "auto";
    this.updateBgmVolume();
  }

  private updateBgmVolume() {
    if (!this.bgm) return;
    this.bgm.volume = this.muted ? 0 : this.mode === "title" ? 0.44 : 0.16;
  }

  private playBgm() {
    if (!this.bgm || this.muted) return;
    this.bgm.play().catch(() => undefined);
  }

  private playClip(name: "impact" | "fire" | "lightning" | "charge", volume: number) {
    const source = this.clips[name];
    if (!source) return;
    const clip = source.cloneNode(true) as HTMLAudioElement;
    clip.volume = volume;
    clip.play().catch(() => undefined);
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
