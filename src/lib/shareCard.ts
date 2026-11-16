import { APP_NAME, APP_TAGLINE } from './brand';

export interface ShareCardData {
  title: string;
  headline: string;
  stats: Array<{ label: string; value: string }>;
  footer: string;
}

const W = 1080;
const H = 1920;

/** Draws a story-sized (9:16) recap image, so people can post their week on Instagram/TikTok/Snap. */
export async function drawShareCard(d: ShareCardData): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) throw new Error('Your browser cannot make images.');
  await document.fonts?.ready.catch(() => undefined);

  // Background: dark with a warm glow, like the app.
  g.fillStyle = '#0b0b0f';
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 520, 40, W / 2, 520, 900);
  glow.addColorStop(0, 'rgba(255,122,40,0.55)');
  glow.addColorStop(1, 'rgba(255,122,40,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  const font = (w: number, px: number) => `${w} ${px}px Outfit, "Space Grotesk", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.fillStyle = '#5eead4';
  g.font = font(800, 64);
  g.fillText(APP_NAME, W / 2, 170);

  g.fillStyle = '#fdba74';
  g.font = font(700, 44);
  g.fillText(d.title.toUpperCase(), W / 2, 380);

  g.fillStyle = '#ffffff';
  g.font = font(800, 76);
  wrap(g, d.headline, W / 2, 490, 900, 92);

  // Stat tiles, two per row.
  const tileW = 440;
  const tileH = 260;
  const gap = 40;
  const top = 760;
  d.stats.slice(0, 6).forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = (W - tileW * 2 - gap) / 2 + col * (tileW + gap);
    const y = top + row * (tileH + gap);
    g.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(g, x, y, tileW, tileH, 40);
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = font(800, 104);
    g.fillText(s.value, x + tileW / 2, y + 140);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.font = font(600, 40);
    g.fillText(s.label, x + tileW / 2, y + 205);
  });

  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.font = font(600, 42);
  g.fillText(d.footer, W / 2, H - 230);
  g.fillStyle = '#5eead4';
  g.font = font(700, 40);
  g.fillText(APP_TAGLINE, W / 2, H - 160);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image.'))), 'image/png'));
}

/** Opens the phone's share sheet with the image, or downloads it where sharing files isn't supported. */
export async function shareImage(blob: Blob, name: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > max && line) {
      g.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) g.fillText(line, x, yy);
}
