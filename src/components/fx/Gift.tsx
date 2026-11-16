import { giftUrl } from './GiftSprite';

/**
 * The daily box (2026-11-16): pixel-art gift on a plinth. `phase` drives the motion:
 * idle (still), ready (a slow hop), shake (anticipation), open (lid flies off, light pours out).
 */
export function Gift({ size = 96, phase = 'idle', locked = false, className = '' }: { size?: number; phase?: 'idle' | 'ready' | 'shake' | 'open' | 'opened'; locked?: boolean; className?: string }) {
  const open = phase === 'open' || phase === 'opened';
  return (
    <span className={`gift is-${phase} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={giftUrl('plinth')} alt="" className="px-art gift-layer" draggable={false} />
      {phase === 'open' && <span className="gift-beam" />}
      <span className="gift-box">
        <img src={giftUrl('base', { locked, open })} alt="" className="px-art gift-layer" draggable={false} />
        {phase !== 'opened' && <img src={giftUrl('lid', { locked })} alt="" className="px-art gift-layer gift-lid" draggable={false} />}
      </span>
      {locked && (
        <span className="gift-lock">
          <svg viewBox="0 0 8 8" width="100%" height="100%" shapeRendering="crispEdges">
            <rect x="1" y="3" width="6" height="5" fill="#0b0c10" />
            <rect x="2" y="4" width="4" height="3" fill="#c3c8d0" />
            <rect x="2" y="1" width="1" height="2" fill="#0b0c10" />
            <rect x="5" y="1" width="1" height="2" fill="#0b0c10" />
            <rect x="3" y="0" width="2" height="1" fill="#0b0c10" />
            <rect x="3.5" y="5" width="1" height="1" fill="#0b0c10" />
          </svg>
        </span>
      )}
    </span>
  );
}
