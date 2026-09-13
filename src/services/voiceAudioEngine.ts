/**
 * Web Audio API synthesizer & Speech Synthesis engine for Voice-Guided Dispatch
 * Provides realistic tactical radio beeps, squelch bursts, affirmative chimes,
 * and high-clarity speech confirmations for law enforcement route status.
 */

class TacticalAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Tactical radio squelch burst (filtered noise + tone click)
   * Simulates turning on/off a law enforcement radio channel
   */
  public playRadioSquelch(volume = 0.25): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Brief white noise burst
      const bufferSize = ctx.sampleRate * 0.08; // 80ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass filter to give radio frequency character (800Hz - 3500Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start(now);

      // 2. High chirp tone (720Hz -> 890Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.06);

      oscGain.gain.setValueAtTime(volume * 0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Tactical audio squelch error:', e);
    }
  }

  /**
   * Affirmative dual-harmonic route confirmed chime
   * Plays when coordinates and route status are locked
   */
  public playRouteConfirmedChime(volume = 0.3): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Dual chord: E5 (659.25Hz) followed by B5 (987.77Hz)
      const frequencies = [659.25, 987.77];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(volume, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.36);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  /**
   * Radar pulse / route status ping
   */
  public playRadarPing(volume = 0.2): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.28);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Radar ping error:', e);
    }
  }

  /**
   * Microphone active listening beep
   */
  public playMicListeningBeep(volume = 0.2): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Mic beep error:', e);
    }
  }
}

export const tacticalAudio = new TacticalAudioSynthesizer();

/**
 * Speech synthesis helper with robust voice selection & cancellation
 */
export function speakTacticalConfirmation(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    playSquelchBefore?: boolean;
    playSquelchAfter?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options?.onEnd) options.onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    if (options?.playSquelchBefore !== false) {
      tacticalAudio.playRadioSquelch(0.25);
    }

    // Clean text for speech
    const cleanText = text
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/#+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/0x[0-9a-fA-F]+/g, 'hex signature')
      .replace(/(\d+\.\d+)°/g, '$1 degrees')
      .replace(/km\/h/g, 'kilometers per hour')
      .replace(/km\b/g, 'kilometers')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate || 1.05;
    utterance.pitch = options?.pitch || 0.95;

    // Pick a clear English voice if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Karen'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options?.playSquelchAfter) {
        tacticalAudio.playRadioSquelch(0.2);
      }
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      if (options?.onEnd) options.onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech confirmation failed:', e);
    if (options?.onEnd) options.onEnd();
  }
}

export function stopTacticalSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
