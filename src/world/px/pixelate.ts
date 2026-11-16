import { useEffect, useState, type RefObject } from 'react';

/**
 * Turns a drawn SVG (the room, its furniture) into real pixel art on the same chunky grid as the
 * cars and the character (2026-11-16). The SVG is rasterised small, colours are snapped to a
 * limited palette, and strong edges get a dark pixel line so objects read like sprites.
 */

const cache = new Map<string, string>();
const OUTLINE = [11, 12, 16];

function lum(d: Uint8ClampedArray, i: number) {
  return (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
}

function process(img: ImageData, opts: { outline: boolean; edges: boolean }) {
  const { data: d, width: w, height: h } = img;
  // Snap colours (keeps gradients from looking smooth) and alpha (no soft edges).
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, Math.round(d[i + c] / 8) * 8);
    d[i + 3] = d[i + 3] < 110 ? 0 : 255;
  }
  const src = new Uint8ClampedArray(d);
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!src[i + 3]) {
        // Outline around a cut-out object (item icons), like the vehicle sprites.
        if (opts.outline && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) {
          d[i] = OUTLINE[0];
          d[i + 1] = OUTLINE[1];
          d[i + 2] = OUTLINE[2];
          d[i + 3] = 255;
        }
        continue;
      }
      if (!opts.edges) continue;
      // Inside a scene: a pixel that sits on a strong edge (brighter thing next to it) gets darker.
      const l = lum(src, i);
      let edge = 0;
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ]) {
        if (!on(x + dx, y + dy)) continue;
        const diff = lum(src, ((y + dy) * w + x + dx) * 4) - l;
        if (diff > edge) edge = diff;
      }
      if (edge > 0.2) {
        const k = 0.55;
        d[i] *= k;
        d[i + 1] *= k;
        d[i + 2] *= k;
      }
    }
  return img;
}

export async function svgToPixels(svg: SVGSVGElement, w: number, h: number, opts: { outline?: boolean; edges?: boolean } = {}): Promise<string | null> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.querySelectorAll('[data-px-skip]').forEach((n) => n.remove());
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  // No anti-aliasing: every edge lands on a whole pixel, like hand-placed pixel art.
  clone.setAttribute('shape-rendering', 'crispEdges');
  const text = new XMLSerializer().serializeToString(clone);
  const key = `${w}x${h}|${opts.outline ? 1 : 0}${opts.edges ? 1 : 0}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    g.imageSmoothingEnabled = true;
    g.drawImage(img, 0, 0, w, h);
    g.putImageData(process(g.getImageData(0, 0, w, h), { outline: !!opts.outline, edges: opts.edges ?? !opts.outline }), 0, 0);
    const out = c.toDataURL();
    if (cache.size > 300) cache.clear();
    cache.set(key, out);
    return out;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rasterises the SVG behind `ref` whenever `sig` changes. Null until the first image is ready. */
export function usePixelated(ref: RefObject<SVGSVGElement | null>, sig: string, w: number, h: number, opts: { outline?: boolean; edges?: boolean } = {}) {
  const [url, setUrl] = useState<string | null>(null);
  const { outline, edges } = opts;
  useEffect(() => {
    let live = true;
    // Wait a frame so the SVG has painted its latest state.
    const id = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      svgToPixels(el, w, h, { outline, edges }).then((u) => {
        if (live && u) setUrl(u);
      });
    });
    return () => {
      live = false;
      cancelAnimationFrame(id);
    };
  }, [ref, sig, w, h, outline, edges]);
  return url;
}
