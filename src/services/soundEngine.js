/**
 * DataX Enterprise Synthesized Audio Engine (Web Audio API)
 * Generates clean, low-latency, modern chimes and notification sounds
 * directly in-memory with zero external mp3/wav audio file dependencies.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('datax_notification_sound_enabled');
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('datax_notification_sound_enabled', String(enabled));
  // Warm up audio context if enabling
  if (enabled) {
    getAudioContext();
  }
}

/**
 * Plays a pleasant, production-grade synthesized notification tone.
 * @param {'success' | 'warning' | 'alert' | 'pop'} type
 */
export function playNotificationSound(type = 'success') {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'success') {
      // Warm, professional two-tone harmonic chime (C5 -> G5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Tone 1: 523.25 Hz (C5)
      osc1.frequency.setValueAtTime(523.25, now);
      // Tone 2: 783.99 Hz (G5) starting at +100ms
      osc2.frequency.setValueAtTime(783.99, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.55);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.55);

    } else if (type === 'warning') {
      // Subtle attention pulse (440Hz -> 554.37Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.12); // C#5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

    } else if (type === 'alert' || type === 'error') {
      // Distinct, high-visibility urgent alert chord
      const freqs = [587.33, 739.99, 880.00]; // D5, F#5, A5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.06));

        // Filter high harsh frequencies for pleasant enterprise sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.001, now + (idx * 0.06));
        gain.gain.linearRampToValueAtTime(0.12, now + (idx * 0.06) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (idx * 0.06));
        osc.stop(now + 0.5);
      });

    } else {
      // Soft modern click / pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (err) {
    console.warn('[DataX Sound Engine] Audio playback omitted:', err);
  }
}
