import { useSyncExternalStore } from 'react';

/**
 * Sleep sounds made on the phone (nothing is downloaded): a few seconds of rain, waves, fan or
 * noise are generated once, turned into a looping audio file, and played with a normal <audio>
 * element so it keeps going when the screen locks (like music). A timer stops it.
 */
export type SoundId = 'rain' | 'waves' | 'fan' | 'brown' | 'pink';

export const SOUNDS: Array<{ id: SoundId; label: string; icon: string; hint: string }> = [
  { id: 'rain', label: 'Rain', icon: '☁', hint: 'Soft rain' },
  { id: 'waves', label: 'Waves', icon: '🌊', hint: 'Slow ocean' },
  { id: 'fan', label: 'Fan', icon: '🌬', hint: 'Low hum' },
  { id: 'brown', label: 'Brown noise', icon: '🌙', hint: 'Deep, calm' },
  { id: 'pink', label: 'Pink noise', icon: '✨', hint: 'Soft static' },
];

const RATE = 22050;
const SECONDS = 24; // waves repeat every 8 s, so a 24 s loop has no seam

function generate(id: SoundId): Float32Array {
  const n = RATE * SECONDS;
  const fade = RATE; // 1 s crossfade at the loop point
  const raw = new Float32Array(n + fade);
  // Pink noise (Paul Kellet's filter) and brown noise (integrated white), shared building blocks.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, brown = 0, lp = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
    brown = (brown + 0.02 * w) / 1.02;
    const br = brown * 3.5;
    let v = 0;
    switch (id) {
      case 'pink':
        v = pink * 0.9;
        break;
      case 'brown':
        v = br;
        break;
      case 'fan':
        lp += (br - lp) * 0.12; // extra low-pass: a soft hum
        v = lp * 1.6;
        break;
      case 'waves': {
        const t = i / RATE;
        const swell = 0.25 + 0.75 * Math.pow(Math.sin((Math.PI * t) / 8), 2);
        v = (br * 0.75 + pink * 0.35) * swell;
        break;
      }
      case 'rain': {
        // Bright hiss plus random drops.
        const hiss = pink - lp;
        lp += (pink - lp) * 0.08;
        const drop = Math.random() < 0.0012 ? (Math.random() * 0.12 + 0.04) * (Math.random() < 0.5 ? -1 : 1) : 0;
        v = hiss * 1.1 + drop + br * 0.25;
        break;
      }
    }
    raw[i] = v;
  }
  // Crossfade the extra second into the start so the loop is seamless.
  const out = raw.slice(0, n);
  for (let i = 0; i < fade; i++) {
    const a = i / fade;
    out[i] = raw[n + i] * (1 - a) + raw[i] * a;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? 0.7 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= gain;
  return out;
}

function wav(samples: Float32Array): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new Blob([buf], { type: 'audio/wav' });
}

const urls = new Map<SoundId, string>();
let audio: HTMLAudioElement | null = null;
let current: { id: SoundId; endsAt: number | null } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const sleepSound = {
  async play(id: SoundId, minutes: number | null) {
    if (!urls.has(id)) urls.set(id, URL.createObjectURL(wav(generate(id))));
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
    }
    audio.src = urls.get(id)!;
    audio.volume = 0.8;
    try {
      await audio.play();
    } catch {
      // the browser blocked it (needs a tap); the button press normally allows it
    }
    current = { id, endsAt: minutes ? Date.now() + minutes * 60000 : null };
    if (timer) clearTimeout(timer);
    if (minutes) timer = setTimeout(() => sleepSound.stop(), minutes * 60000);
    try {
      const label = SOUNDS.find((s) => s.id === id)?.label ?? 'Sleep sound';
      if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: label, artist: 'Dayforge sleep' });
    } catch {
      // optional
    }
    emit();
  },
  stop() {
    audio?.pause();
    current = null;
    if (timer) clearTimeout(timer);
    timer = null;
    emit();
  },
};

export function useSleepSound() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
