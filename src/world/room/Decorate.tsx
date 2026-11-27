import './decorate.css';
import { useEffect, useRef, useState } from 'react';
import type { PlacedDecor, WorldState } from '../../lib/types';
import { ItemArt, ROOM_H, ROOM_W } from './Room';
import { PROPERTIES } from '../catalog';
import { blockedBy, boxOf, clampSpot, itemOf, layoutOf } from './layout';

/**
 * Decorating mode (2026-11-27): tap a decoration to pick it up, drag it where you want it and see
 * a preview before you save. The preview turns red where it would overlap something.
 */

export interface Draft {
  uid: string;
  itemId: string;
  x: number;
  y: number;
  s?: 's' | 'm' | 'l';
  /** Not in the room yet (a new copy, or trying before buying). */
  isNew: boolean;
  /** Trying something you don't own yet. */
  buy?: boolean;
}

export function DecorateOverlay({ world, draft, onSelect, onDraft }: { world: WorldState; draft: Draft | null; onSelect: (p: PlacedDecor) => void; onDraft: (d: Draft) => void }) {
  const layout = layoutOf(world);
  const tier = (PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0]).tier;
  // While dragging, the position lives here so only this small layer re-renders.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => setPos(null), [draft?.uid, draft?.x, draft?.y]);
  const grab = useRef<{ dx: number; dy: number; host: DOMRect } | null>(null);
  const shown = draft ? { ...draft, ...(pos ?? {}) } : null;
  const blocked = shown ? blockedBy(world, layout, { ...shown, id: shown.itemId }) : null;

  const toRoom = (e: React.PointerEvent, host: DOMRect) => ({ x: ((e.clientX - host.left) / host.width) * ROOM_W, y: ((e.clientY - host.top) / host.height) * ROOM_H });

  return (
    <div className="absolute inset-0 z-[800]" aria-label="Decorating">
      {layout.map((p) => {
        if (p.uid === draft?.uid) return null;
        const [x, y, w, h] = boxOf(p);
        return (
          <button
            key={p.uid}
            type="button"
            onClick={() => onSelect(p)}
            aria-label={`Move ${itemOf(p)?.name ?? 'decoration'}`}
            className="deco-spot absolute"
            style={{ left: `${(x / ROOM_W) * 100}%`, top: `${(y / ROOM_H) * 100}%`, width: `${(w / ROOM_W) * 100}%`, height: `${(h / ROOM_H) * 100}%` }}
          />
        );
      })}
      {shown &&
        (() => {
          const item = itemOf({ id: shown.itemId });
          if (!item) return null;
          const [x, y, w, h] = boxOf({ ...shown, id: shown.itemId });
          return (
            <div
              role="button"
              tabIndex={0}
              aria-label={`${item.name}: drag to move`}
              className={`deco-ghost absolute touch-none ${blocked ? 'deco-bad' : 'deco-ok'}`}
              style={{ left: `${(x / ROOM_W) * 100}%`, top: `${(y / ROOM_H) * 100}%`, width: `${(w / ROOM_W) * 100}%`, height: `${(h / ROOM_H) * 100}%` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture?.(e.pointerId);
                const host = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                const at = toRoom(e, host);
                grab.current = { dx: at.x - x, dy: at.y - y, host };
              }}
              onPointerMove={(e) => {
                const g = grab.current;
                if (!g) return;
                e.stopPropagation();
                const at = toRoom(e, g.host);
                setPos(clampSpot(item.slot, at.x - g.dx, at.y - g.dy, w, h));
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                if (grab.current && pos) onDraft({ ...shown, x: pos.x, y: pos.y });
                grab.current = null;
              }}
              onPointerCancel={() => (grab.current = null)}
              onKeyDown={(e) => {
                const step: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
                const d = step[e.key];
                if (!d) return;
                e.preventDefault();
                const c = clampSpot(item.slot, shown.x + d[0], shown.y + d[1], w, h);
                onDraft({ ...shown, ...c });
              }}
            >
              <ItemArt itemId={shown.itemId} tier={tier} />
              {blocked && (
                <span className="deco-why absolute left-1/2 -top-1 -translate-x-1/2 -translate-y-full px-label" aria-live="polite">
                  Overlaps {blocked}
                </span>
              )}
            </div>
          );
        })()}
    </div>
  );
}

/** Is the draft fine where it is? (Used for the Save button.) */
export function draftBlocked(world: WorldState, d: Draft): string | null {
  return blockedBy(world, layoutOf(world), { ...d, id: d.itemId });
}
