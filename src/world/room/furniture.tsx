import { shade, tint } from './paint';

/**
 * Furniture models for the room (2026-11-14 World rebuild). Every model is its own drawing with its
 * own silhouette: a racing chair is not a recoloured office chair. All drawn in room coordinates
 * (1200 × 560, floor line at y = 400), so each sits in its place. `c` is the main material colour,
 * `a` an accent (stitching, legs, LEDs).
 */
export interface DrawProps {
  c: string;
  a: string;
  night: boolean;
}

const Shadow = ({ cx, cy, rx, ry = 10, o = 0.32 }: { cx: number; cy: number; rx: number; ry?: number; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#rsh)" opacity={o} />
);

/* ================================================================ BEDS (x 40–330, front at y≈455) */

export const BEDS: Record<string, (p: DrawProps) => React.ReactNode> = {
  /** A mattress on the floor with a crumpled duvet: everyone starts somewhere. */
  mattress: ({ c }) => (
    <g>
      <Shadow cx={185} cy={458} rx={150} ry={12} />
      <rect x={45} y={410} width={280} height={42} rx={10} fill="#e9e4dc" />
      <rect x={45} y={440} width={280} height={12} rx={6} fill="#cfc8bd" />
      <path d="M120 412 Q170 396 230 406 Q290 398 325 414 L325 446 Q260 452 190 448 Q150 452 120 446 Z" fill={c} />
      <path d="M140 420 Q190 412 240 420 M170 434 Q220 426 290 434" stroke={shade(c, 0.18)} strokeWidth={3} fill="none" strokeLinecap="round" />
      <rect x={58} y={398} width={70} height={26} rx={12} fill="#f6f2ec" />
      <path d="M66 404 Q92 396 120 404" stroke="#ddd6cc" strokeWidth={2} fill="none" />
    </g>
  ),
  /** Black metal single bed with a rail headboard. */
  single: ({ c }) => (
    <g>
      <Shadow cx={185} cy={462} rx={150} />
      <g stroke="#2b2d33" strokeWidth={5} strokeLinecap="round">
        <path d="M56 462 V300 M314 462 V340" />
        <path d="M56 312 H140 M56 336 H140 M56 360 H140" strokeWidth={4} />
        <path d="M56 300 Q98 288 140 300 V462" />
      </g>
      <rect x={60} y={392} width={256} height={40} rx={8} fill="#f1ede6" />
      <path d="M150 384 H316 V436 Q240 446 150 438 Z" fill={c} />
      <path d="M150 384 H316 V398 H150 Z" fill={tint(c, 0.15)} />
      <rect x={70} y={366} width={72} height={30} rx={12} fill="#fbf8f3" />
      <rect x={60} y={430} width={256} height={10} fill="#2b2d33" />
    </g>
  ),
  /** Low oak platform bed with a slatted headboard. */
  platform: ({ c, a }) => (
    <g>
      <Shadow cx={185} cy={458} rx={158} />
      <rect x={40} y={300} width={110} height={120} rx={6} fill={shade(a, 0.05)} />
      {[52, 72, 92, 112, 132].map((x) => (
        <rect key={x} x={x} y={308} width={12} height={104} rx={3} fill={tint(a, 0.12)} />
      ))}
      <rect x={36} y={420} width={300} height={30} rx={6} fill={a} />
      <rect x={36} y={440} width={300} height={10} fill={shade(a, 0.22)} />
      <rect x={46} y={396} width={282} height={30} rx={8} fill="#f3efe8" />
      <path d="M140 388 H330 V428 Q234 438 140 430 Z" fill={c} />
      <path d="M140 388 H330 V402 H140 Z" fill={tint(c, 0.18)} />
      <rect x={58} y={368} width={86} height={32} rx={13} fill="#fbf8f3" />
      <rect x={70} y={376} width={72} height={26} rx={11} fill={tint(c, 0.4)} />
    </g>
  ),
  /** Bunk bed with a ladder. */
  bunk: ({ c, a }) => (
    <g>
      <Shadow cx={185} cy={462} rx={155} />
      <g fill={a}>
        <rect x={44} y={190} width={12} height={272} rx={3} />
        <rect x={314} y={190} width={12} height={272} rx={3} />
        <rect x={44} y={282} width={282} height={14} rx={3} />
        <rect x={44} y={420} width={282} height={16} rx={3} />
        <rect x={44} y={212} width={282} height={8} rx={3} />
      </g>
      <rect x={58} y={256} width={254} height={26} rx={7} fill="#f1ede6" />
      <path d="M140 250 H312 V280 H140 Z" fill={shade(c, 0.1)} />
      <rect x={58} y={392} width={254} height={30} rx={7} fill="#f1ede6" />
      <path d="M140 386 H312 V420 H140 Z" fill={c} />
      <rect x={66} y={236} width={64} height={22} rx={10} fill="#fbf8f3" />
      <rect x={66} y={372} width={64} height={22} rx={10} fill="#fbf8f3" />
      <g stroke={shade(a, 0.15)} strokeWidth={5}>
        <path d="M282 220 V420 M302 220 V420" />
        <path d="M282 250 H302 M282 290 H302 M282 330 H302 M282 370 H302" strokeWidth={4} />
      </g>
    </g>
  ),
  /** Storage bed with drawers and a padded headboard. */
  captain: ({ c, a }) => (
    <g>
      <Shadow cx={185} cy={460} rx={156} />
      <rect x={40} y={292} width={44} height={160} rx={8} fill={shade(a, 0.1)} />
      <rect x={46} y={300} width={32} height={86} rx={8} fill={tint(c, 0.25)} />
      <rect x={40} y={400} width={292} height={52} rx={6} fill={a} />
      {[56, 152, 248].map((x) => (
        <g key={x}>
          <rect x={x} y={412} width={80} height={30} rx={4} fill={tint(a, 0.1)} />
          <rect x={x + 30} y={424} width={20} height={4} rx={2} fill={shade(a, 0.4)} />
        </g>
      ))}
      <rect x={84} y={380} width={246} height={24} rx={7} fill="#f2eee7" />
      <path d="M160 372 H330 V404 H160 Z" fill={c} />
      <rect x={92} y={356} width={70} height={28} rx={12} fill="#fbf8f3" />
    </g>
  ),
  /** Four-poster canopy bed. */
  canopy: ({ c, a }) => (
    <g>
      <Shadow cx={185} cy={462} rx={162} />
      <g fill={a}>
        <rect x={40} y={150} width={10} height={312} rx={3} />
        <rect x={320} y={150} width={10} height={312} rx={3} />
        <rect x={34} y={144} width={302} height={12} rx={4} />
      </g>
      <path d="M50 156 Q60 260 54 380 L76 380 Q88 250 80 156 Z" fill={tint(c, 0.55)} opacity={0.9} />
      <path d="M320 156 Q310 260 316 380 L294 380 Q282 250 290 156 Z" fill={tint(c, 0.55)} opacity={0.9} />
      <path d="M50 156 Q185 196 320 156" fill={tint(c, 0.5)} />
      <rect x={52} y={300} width={100} height={110} rx={10} fill={shade(c, 0.15)} />
      <rect x={46} y={406} width={278} height={34} rx={8} fill="#f4f0e9" />
      <path d="M140 398 H324 V440 Q232 450 140 440 Z" fill={c} />
      <path d="M140 398 H324 V412 H140 Z" fill={tint(c, 0.2)} />
      <rect x={60} y={378} width={84} height={30} rx={13} fill="#fffaf2" />
      <rect x={44} y={438} width={282} height={14} rx={4} fill={shade(a, 0.1)} />
    </g>
  ),
  /** King bed with a tall tufted headboard and side tables. */
  royal: ({ c, a }) => (
    <g>
      <Shadow cx={185} cy={462} rx={170} />
      <rect x={30} y={360} width={40} height={92} rx={5} fill={a} />
      <rect x={300} y={360} width={40} height={92} rx={5} fill={a} />
      <rect x={36} y={384} width={28} height={6} rx={3} fill={tint(a, 0.4)} />
      <rect x={306} y={384} width={28} height={6} rx={3} fill={tint(a, 0.4)} />
      <path d="M74 400 V250 Q185 200 296 250 V400 Z" fill={c} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((i) => <circle key={`${r}${i}`} cx={104 + i * 40 + (r % 2) * 20} cy={268 + r * 36} r={3} fill={shade(c, 0.35)} />),
      )}
      <path d="M74 400 V250 Q185 200 296 250" fill="none" stroke={tint(c, 0.25)} strokeWidth={4} />
      <rect x={70} y={404} width={232} height={40} rx={10} fill="#f6f2eb" />
      <path d="M130 396 H302 V444 Q216 454 130 446 Z" fill={tint(c, 0.35)} />
      <rect x={84} y={372} width={78} height={34} rx={14} fill="#fffaf3" />
      <rect x={168} y={372} width={78} height={34} rx={14} fill="#fffaf3" />
      <rect x={66} y={444} width={240} height={10} rx={3} fill={shade(c, 0.3)} />
    </g>
  ),
};

/* ================================================================ SOFAS (x 420–720, front at y≈458) */

export const SEATS: Record<string, (p: DrawProps) => React.ReactNode> = {
  beanbag: ({ c }) => (
    <g>
      <Shadow cx={500} cy={460} rx={70} />
      <path d="M440 456 Q428 400 470 382 Q520 362 556 392 Q578 420 566 456 Z" fill={c} />
      <path d="M452 420 Q490 396 540 410" stroke={shade(c, 0.2)} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M470 384 Q480 372 500 372" stroke={tint(c, 0.3)} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  ),
  /** Mid-century loveseat on tapered legs. */
  loveseat: ({ c, a }) => (
    <g>
      <Shadow cx={570} cy={462} rx={140} />
      <path d="M476 462 L470 440 M664 462 L670 440" stroke={a} strokeWidth={6} strokeLinecap="round" />
      <rect x={440} y={340} width={260} height={80} rx={26} fill={shade(c, 0.08)} />
      <rect x={430} y={380} width={40} height={64} rx={16} fill={c} />
      <rect x={670} y={380} width={40} height={64} rx={16} fill={c} />
      <rect x={462} y={396} width={108} height={46} rx={12} fill={tint(c, 0.1)} />
      <rect x={572} y={396} width={108} height={46} rx={12} fill={tint(c, 0.1)} />
      <rect x={462} y={396} width={218} height={8} rx={4} fill={tint(c, 0.25)} />
    </g>
  ),
  /** Classic three-seat sofa. */
  sofa: ({ c, a }) => (
    <g>
      <Shadow cx={570} cy={462} rx={155} />
      <rect x={428} y={444} width={10} height={16} fill={shade(a, 0.2)} />
      <rect x={702} y={444} width={10} height={16} fill={shade(a, 0.2)} />
      <rect x={432} y={336} width={276} height={82} rx={16} fill={shade(c, 0.12)} />
      {[448, 534, 620].map((x) => (
        <rect key={x} x={x} y={346} width={80} height={62} rx={14} fill={shade(c, 0.04)} />
      ))}
      <rect x={420} y={380} width={300} height={68} rx={14} fill={c} />
      <rect x={414} y={364} width={36} height={86} rx={14} fill={tint(c, 0.06)} />
      <rect x={690} y={364} width={36} height={86} rx={14} fill={tint(c, 0.06)} />
      {[452, 540, 628].map((x) => (
        <rect key={x} x={x} y={392} width={84} height={22} rx={8} fill={tint(c, 0.14)} />
      ))}
    </g>
  ),
  /** Low L-shaped sectional with a chaise. */
  sectional: ({ c }) => (
    <g>
      <Shadow cx={570} cy={470} rx={170} ry={14} />
      <rect x={410} y={352} width={318} height={64} rx={14} fill={shade(c, 0.14)} />
      <rect x={404} y={398} width={330} height={50} rx={10} fill={c} />
      <path d="M622 398 H734 V478 Q734 488 724 488 H632 Q622 488 622 478 Z" fill={tint(c, 0.05)} />
      <path d="M622 446 H734" stroke={shade(c, 0.12)} strokeWidth={3} />
      <rect x={420} y={404} width={98} height={18} rx={7} fill={tint(c, 0.16)} />
      <rect x={522} y={404} width={98} height={18} rx={7} fill={tint(c, 0.16)} />
      <rect x={630} y={404} width={98} height={36} rx={9} fill={tint(c, 0.16)} />
      <rect x={430} y={362} width={60} height={42} rx={10} fill="#e9e3d8" transform="rotate(-6 460 383)" />
      <rect x={660} y={362} width={54} height={40} rx={10} fill={shade(c, 0.35)} transform="rotate(5 687 382)" />
    </g>
  ),
  /** Tufted leather chesterfield with rolled arms. */
  chesterfield: ({ c, a }) => (
    <g>
      <Shadow cx={570} cy={464} rx={160} />
      <circle cx={430} cy={456} r={5} fill={a} />
      <circle cx={710} cy={456} r={5} fill={a} />
      <rect x={430} y={340} width={280} height={84} rx={10} fill={c} />
      {[0, 1].map((r) => [0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={`${r}${i}`} cx={450 + i * 40 + (r % 2) * 20} cy={356 + r * 22} r={2.5} fill={shade(c, 0.45)} />))}
      <rect x={424} y={398} width={292} height={54} rx={8} fill={shade(c, 0.06)} />
      <rect x={438} y={400} width={132} height={22} rx={7} fill={tint(c, 0.08)} />
      <rect x={572} y={400} width={132} height={22} rx={7} fill={tint(c, 0.08)} />
      <path d="M404 384 Q404 362 424 362 Q446 362 446 384 V452 H404 Z" fill={tint(c, 0.04)} />
      <path d="M694 384 Q694 362 716 362 Q736 362 736 384 V452 H694 Z" fill={tint(c, 0.04)} />
      <circle cx={425} cy={382} r={12} fill={shade(c, 0.12)} />
      <circle cx={715} cy={382} r={12} fill={shade(c, 0.12)} />
    </g>
  ),
  /** Cloud-like modular sofa: fat round cushions. */
  cloud: ({ c }) => (
    <g>
      <Shadow cx={570} cy={464} rx={165} />
      <rect x={424} y={346} width={292} height={74} rx={36} fill={shade(c, 0.07)} />
      <rect x={410} y={392} width={320} height={64} rx={30} fill={c} />
      <rect x={404} y={366} width={64} height={90} rx={32} fill={tint(c, 0.05)} />
      <rect x={672} y={366} width={64} height={90} rx={32} fill={tint(c, 0.05)} />
      <path d="M468 404 Q570 392 672 404" stroke={tint(c, 0.25)} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M570 398 V452" stroke={shade(c, 0.1)} strokeWidth={3} />
    </g>
  ),
  /** Gaming sofa: dark, with cup holders and an LED edge. */
  gamer: ({ c, a, night }) => (
    <g>
      <Shadow cx={570} cy={462} rx={160} />
      <rect x={430} y={330} width={280} height={90} rx={18} fill={shade(c, 0.15)} />
      {[446, 532, 618].map((x) => (
        <path key={x} d={`M${x} 410 V352 Q${x} 340 ${x + 12} 340 H${x + 64} Q${x + 76} 340 ${x + 76} 352 V410 Z`} fill={c} />
      ))}
      <rect x={414} y={392} width={312} height={60} rx={10} fill={shade(c, 0.05)} />
      <rect x={414} y={448} width={312} height={4} rx={2} fill={a} opacity={night ? 1 : 0.7} />
      {[520, 610].map((x) => (
        <g key={x}>
          <rect x={x} y={380} width={22} height={24} rx={4} fill={shade(c, 0.3)} />
          <circle cx={x + 11} cy={386} r={6} fill="#0d0e12" stroke={a} strokeWidth={1.5} />
        </g>
      ))}
      <path d="M452 398 H512 M542 398 H602 M632 398 H712" stroke={a} strokeWidth={2} strokeDasharray="3 4" opacity={0.6} />
    </g>
  ),
};

/* ================================================================ CHAIRS (seen from behind, x 940–1060, floor y≈505) */

const Caster = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={5} fill="#16171b" />;
const Base5 = ({ cx, y }: { cx: number; y: number }) => (
  <g>
    <rect x={cx - 5} y={y - 48} width={10} height={44} rx={3} fill="#3b3e46" />
    <path d={`M${cx - 52} ${y} L${cx} ${y - 10} L${cx + 52} ${y} M${cx - 24} ${y + 4} L${cx} ${y - 10} L${cx + 24} ${y + 4}`} stroke="#25272d" strokeWidth={7} strokeLinecap="round" fill="none" />
    <Caster x={cx - 52} y={y + 3} />
    <Caster x={cx + 52} y={y + 3} />
    <Caster x={cx - 24} y={y + 7} />
    <Caster x={cx + 24} y={y + 7} />
  </g>
);

export const CHAIRS: Record<string, (p: DrawProps) => React.ReactNode> = {
  stool: ({ c }) => (
    <g>
      <Shadow cx={1000} cy={506} rx={46} />
      <path d="M972 504 L982 430 M1028 504 L1018 430 M990 504 L994 430 M1010 504 L1006 430" stroke={shade(c, 0.25)} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={1000} cy={426} rx={38} ry={10} fill={c} />
      <path d="M978 470 H1022" stroke={shade(c, 0.25)} strokeWidth={4} />
    </g>
  ),
  /** Simple office chair with a mesh back. */
  office: ({ c }) => (
    <g>
      <Shadow cx={1000} cy={508} rx={60} />
      <Base5 cx={1000} y={500} />
      <rect x={952} y={430} width={96} height={22} rx={9} fill={shade(c, 0.2)} />
      <path d="M960 432 Q956 350 968 318 Q1000 306 1032 318 Q1044 350 1040 432 Z" fill={shade(c, 0.35)} />
      <path d="M966 428 Q962 352 972 324 Q1000 314 1028 324 Q1038 352 1034 428 Z" fill={c} opacity={0.75} />
      <g stroke={shade(c, 0.45)} strokeWidth={1} opacity={0.5}>
        {[340, 356, 372, 388, 404, 420].map((y) => (
          <path key={y} d={`M966 ${y} H1034`} />
        ))}
      </g>
    </g>
  ),
  /** Racing-style gaming chair: tall back, side wings, headrest pillow, stripes. */
  racer: ({ c, a }) => (
    <g>
      <Shadow cx={1000} cy={508} rx={62} />
      <Base5 cx={1000} y={500} />
      <rect x={946} y={432} width={108} height={22} rx={8} fill="#1b1c21" />
      <path d="M952 440 L944 330 Q942 290 960 280 L964 250 Q1000 236 1036 250 L1040 280 Q1058 290 1056 330 L1048 440 Z" fill="#1c1d22" />
      <path d="M962 436 L956 336 Q956 304 970 296 L974 268 Q1000 258 1026 268 L1030 296 Q1044 304 1044 336 L1038 436 Z" fill={shade(c, 0.05)} />
      <path d="M986 266 L984 436 M1014 266 L1016 436" stroke={a} strokeWidth={7} />
      <rect x={976} y={278} width={48} height={20} rx={9} fill="#121317" />
      <path d="M944 330 L930 354 L944 380 M1056 330 L1070 354 L1056 380" stroke="#1c1d22" strokeWidth={8} strokeLinecap="round" fill="none" />
      <circle cx={1000} cy={360} r={8} fill="none" stroke={a} strokeWidth={2} opacity={0.7} />
    </g>
  ),
  /** Huge padded "throne" gaming chair with a high rounded back and arm pads. */
  throne: ({ c, a }) => (
    <g>
      <Shadow cx={1000} cy={510} rx={70} />
      <Base5 cx={1000} y={502} />
      <path d="M940 450 Q930 360 944 280 Q956 220 1000 214 Q1044 220 1056 280 Q1070 360 1060 450 Z" fill={shade(c, 0.25)} />
      <path d="M952 444 Q944 366 956 290 Q966 236 1000 232 Q1034 236 1044 290 Q1056 366 1048 444 Z" fill={c} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M960 ${290 + i * 38} Q1000 ${282 + i * 38} 1040 ${290 + i * 38}`} stroke={shade(c, 0.2)} strokeWidth={3} fill="none" />
      ))}
      <rect x={918} y={400} width={28} height={50} rx={10} fill={shade(c, 0.3)} />
      <rect x={1054} y={400} width={28} height={50} rx={10} fill={shade(c, 0.3)} />
      <rect x={918} y={400} width={28} height={8} rx={4} fill={a} />
      <rect x={1054} y={400} width={28} height={8} rx={4} fill={a} />
      <path d="M1000 232 V444" stroke={a} strokeWidth={2} opacity={0.6} />
    </g>
  ),
  /** Ergonomic pro chair: split mesh back, lumbar bar, headrest on a stalk. */
  ergo: ({ c, a }) => (
    <g>
      <Shadow cx={1000} cy={508} rx={60} />
      <Base5 cx={1000} y={500} />
      <rect x={950} y={432} width={100} height={20} rx={8} fill="#26282e" />
      <path d="M1000 300 V254" stroke="#2e3036" strokeWidth={6} />
      <path d="M970 256 Q1000 238 1030 256 L1026 276 Q1000 266 974 276 Z" fill={c} />
      <path d="M962 430 Q954 360 966 312 Q1000 296 1034 312 Q1046 360 1038 430 Z" fill="#2a2c32" />
      <path d="M968 424 Q962 364 972 320 Q1000 308 1028 320 Q1038 364 1032 424 Z" fill={c} opacity={0.55} />
      <path d="M964 392 Q1000 404 1036 392" stroke={a} strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d="M948 400 H936 V430 M1052 400 H1064 V430" stroke="#2e3036" strokeWidth={6} strokeLinecap="round" fill="none" />
    </g>
  ),
  /** Egg pod chair on a disc base. */
  egg: ({ c, a }) => (
    <g>
      <Shadow cx={1000} cy={508} rx={56} />
      <ellipse cx={1000} cy={502} rx={44} ry={8} fill={shade(a, 0.2)} />
      <rect x={995} y={450} width={10} height={52} fill={a} />
      <path d="M940 420 Q930 300 1000 260 Q1070 300 1060 420 Q1040 462 1000 462 Q960 462 940 420 Z" fill={c} />
      <path d="M952 412 Q946 318 1000 284 Q1054 318 1048 412" stroke={tint(c, 0.2)} strokeWidth={4} fill="none" />
    </g>
  ),
  /** Wooden library chair with turned spindles. */
  windsor: ({ c }) => (
    <g>
      <Shadow cx={1000} cy={506} rx={50} />
      <path d="M966 504 L970 444 M1034 504 L1030 444" stroke={shade(c, 0.2)} strokeWidth={6} strokeLinecap="round" />
      <rect x={958} y={432} width={84} height={16} rx={6} fill={c} />
      <path d="M962 436 Q960 330 1000 316 Q1040 330 1038 436" stroke={c} strokeWidth={8} fill="none" />
      {[976, 988, 1000, 1012, 1024].map((x) => (
        <path key={x} d={`M${x} 436 V330`} stroke={shade(c, 0.1)} strokeWidth={4} />
      ))}
    </g>
  ),
};

/* ================================================================ DESKS (x 870–1110, top y≈345, floor y≈450) */

export const DESKS: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  /** Plain desk on four legs. */
  simple: ({ c }) => (
    <g>
      <Shadow cx={990} cy={452} rx={125} />
      <rect x={880} y={346} width={220} height={14} rx={3} fill={c} />
      <rect x={880} y={358} width={220} height={4} fill={shade(c, 0.25)} />
      <path d="M892 360 V450 M1088 360 V450" stroke={shade(c, 0.3)} strokeWidth={8} />
    </g>
  ),
  /** Trestle desk with A-frame legs. */
  trestle: ({ c, a }) => (
    <g>
      <Shadow cx={990} cy={452} rx={128} />
      <rect x={874} y={344} width={232} height={12} rx={3} fill={c} />
      <path d="M896 356 L882 450 M896 356 L914 450 M1084 356 L1070 450 M1084 356 L1100 450 M890 410 H1092" stroke={a} strokeWidth={6} strokeLinecap="round" />
    </g>
  ),
  /** Gaming desk: carbon top, angled legs, LED under the edge. */
  gaming: ({ c, a, night }) => (
    <g>
      <Shadow cx={990} cy={452} rx={135} />
      <path d="M872 342 H1108 L1112 356 H868 Z" fill={c} />
      <path d="M868 356 H1112" stroke={a} strokeWidth={3} opacity={night ? 1 : 0.65} />
      <path d="M900 358 L880 450 H906 L922 380 Z M1080 358 L1100 450 H1074 L1058 380 Z" fill={shade(c, 0.2)} />
      <path d="M922 380 H1058" stroke={shade(c, 0.2)} strokeWidth={6} />
      <rect x={890} y={336} width={200} height={8} rx={3} fill="#2a2c33" />
    </g>
  ),
  /** Motorised standing desk with T-legs and a control pad. */
  standing: ({ c }) => (
    <g>
      <Shadow cx={990} cy={452} rx={125} />
      <rect x={878} y={340} width={224} height={14} rx={4} fill={c} />
      <rect x={912} y={354} width={16} height={92} fill="#2d2f35" />
      <rect x={1052} y={354} width={16} height={92} fill="#2d2f35" />
      <rect x={908} y={354} width={24} height={40} fill="#3b3e45" />
      <rect x={1048} y={354} width={24} height={40} fill="#3b3e45" />
      <path d="M888 450 H952 M1028 450 H1092" stroke="#2d2f35" strokeWidth={8} strokeLinecap="round" />
      <rect x={1078} y={352} width={20} height={8} rx={2} fill="#1d1e22" />
      <circle cx={1084} cy={356} r={1.6} fill="#5eead4" />
    </g>
  ),
  /** L-shaped corner desk with a drawer unit. */
  lshape: ({ c, a }) => (
    <g>
      <Shadow cx={990} cy={456} rx={140} />
      <rect x={862} y={344} width={250} height={14} rx={3} fill={c} />
      <path d="M1112 344 L1150 372 V386 L1112 358 Z" fill={shade(c, 0.12)} />
      <rect x={870} y={358} width={60} height={92} rx={3} fill={a} />
      {[366, 396, 426].map((y) => (
        <g key={y}>
          <rect x={874} y={y} width={52} height={26} rx={2} fill={tint(a, 0.08)} />
          <rect x={892} y={y + 11} width={16} height={4} rx={2} fill={shade(a, 0.4)} />
        </g>
      ))}
      <path d="M1100 358 V450 M1144 384 V462" stroke={shade(c, 0.3)} strokeWidth={8} />
    </g>
  ),
  /** Creator studio desk: white, with a monitor shelf riser. */
  studio: ({ c }) => (
    <g>
      <Shadow cx={990} cy={452} rx={130} />
      <rect x={874} y={346} width={232} height={14} rx={6} fill={c} />
      <rect x={910} y={330} width={160} height={8} rx={3} fill={shade(c, 0.08)} />
      <path d="M916 338 V346 M1064 338 V346" stroke={shade(c, 0.2)} strokeWidth={4} />
      <path d="M890 360 L884 450 M1090 360 L1096 450" stroke="#c9c4bc" strokeWidth={7} strokeLinecap="round" />
    </g>
  ),
  /** Heavy executive desk: wood, front panel with drawers, brass handles. */
  exec: ({ c, a }) => (
    <g>
      <Shadow cx={990} cy={454} rx={140} />
      <rect x={866} y={338} width={248} height={16} rx={4} fill={tint(c, 0.08)} />
      <rect x={872} y={354} width={236} height={98} rx={4} fill={c} />
      <rect x={882} y={364} width={70} height={80} rx={3} fill={shade(c, 0.12)} />
      <rect x={1028} y={364} width={70} height={80} rx={3} fill={shade(c, 0.12)} />
      <rect x={962} y={364} width={56} height={36} rx={3} fill={shade(c, 0.08)} />
      {[[917, 386], [917, 420], [1063, 386], [1063, 420], [990, 382]].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x - 8} y={y} width={16} height={4} rx={2} fill={a} />
      ))}
      <rect x={1050} y={318} width={44} height={20} rx={3} fill="#2a1d14" />
      <path d="M1058 318 V306 M1086 318 V306" stroke={a} strokeWidth={2} />
    </g>
  ),
  /** Glass top on chrome legs. */
  glass: ({ c }) => (
    <g>
      <Shadow cx={990} cy={452} rx={125} o={0.2} />
      <rect x={876} y={344} width={228} height={8} rx={3} fill={tint(c, 0.5)} opacity={0.5} />
      <path d="M876 344 H1104" stroke="#ffffff" strokeWidth={1.5} opacity={0.7} />
      <path d="M896 352 L888 450 M1084 352 L1092 450 M896 352 L904 450 M1084 352 L1076 450" stroke="#c7ccd4" strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
};

/* ================================================================ TECH on the desk (x 900–1080, y 230–345) */

const Screen = ({ x, y, w, h, on, tone = '#3b82f6', id = 's' }: { x: number; y: number; w: number; h: number; on: boolean; tone?: string; id?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={3} fill="#121318" />
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={2} fill={on ? tone : '#1b2230'} opacity={on ? 0.85 : 1} />
    {on && (
      <g className="room-screen" opacity={0.9}>
        <rect x={x + 8} y={y + 8} width={(w - 16) * 0.55} height={4} rx={2} fill="#fff" opacity={0.75} />
        <rect x={x + 8} y={y + 16} width={(w - 16) * 0.8} height={3} rx={1.5} fill="#fff" opacity={0.4} />
        <rect x={x + 8} y={y + 23} width={(w - 16) * 0.4} height={3} rx={1.5} fill="#fff" opacity={0.4} />
        <rect x={x + w - 8 - (w - 16) * 0.3} y={y + h - 18} width={(w - 16) * 0.3} height={10} rx={2} fill="#fff" opacity={0.3} key={id} />
      </g>
    )}
    <path d={`M${x + 3} ${y + 3} L${x + w * 0.45} ${y + 3} L${x + 3} ${y + h * 0.7} Z`} fill="#fff" opacity={0.06} />
  </g>
);
const Stand = ({ cx, top }: { cx: number; top: number }) => (
  <g fill="#2a2c32">
    <rect x={cx - 3} y={top} width={6} height={340 - top} />
    <rect x={cx - 18} y={338} width={36} height={6} rx={2} />
  </g>
);
const Keyboard = ({ x = 950, w = 80, rgb }: { x?: number; w?: number; rgb?: string }) => (
  <g>
    <rect x={x} y={336} width={w} height={8} rx={2} fill="#1e2026" />
    {rgb && <rect x={x + 2} y={337} width={w - 4} height={2} rx={1} fill={rgb} opacity={0.8} />}
    <rect x={x + w + 10} y={337} width={14} height={7} rx={3.5} fill="#1e2026" />
  </g>
);

export const TECH: Record<string, (p: DrawProps & { on?: boolean }) => React.ReactNode> = {
  none: () => null,
  /** Laptop and a mug. */
  laptop: ({ c }) => (
    <g>
      <path d="M948 340 H1032 L1040 346 H940 Z" fill="#c9ced6" />
      <path d="M954 340 L960 292 H1022 L1028 340 Z" fill={c} />
      <path d="M960 336 L965 298 H1018 L1022 336 Z" fill="#20324d" />
      <circle cx={991} cy={316} r={6} fill="#fff" opacity={0.15} />
      <rect x={1050} y={326} width={14} height={18} rx={3} fill="#e7e2da" />
      <path d="M1064 330 Q1072 334 1064 340" stroke="#e7e2da" strokeWidth={2.5} fill="none" />
      <path className="room-steam" d="M1055 322 Q1050 312 1057 304 Q1062 296 1056 288" stroke="#fff" strokeWidth={2} fill="none" opacity={0.35} strokeLinecap="round" />
    </g>
  ),
  /** One monitor and a PC tower. */
  single: ({ c, a, night }) => (
    <g>
      <rect x={1066} y={268} width={36} height={76} rx={4} fill={c} />
      <rect x={1070} y={274} width={4} height={64} rx={2} fill={a} opacity={night ? 1 : 0.6} />
      <circle cx={1090} cy={282} r={2.5} fill="#9ca3af" />
      <Stand cx={990} top={318} />
      <Screen x={942} y={262} w={96} h={60} on />
      <Keyboard x={950} w={72} />
    </g>
  ),
  /** Two monitors side by side, RGB keyboard. */
  dual: ({ a }) => (
    <g>
      <Stand cx={942} top={316} />
      <Stand cx={1040} top={316} />
      <Screen x={896} y={262} w={94} h={58} on tone="#4f46e5" />
      <Screen x={992} y={262} w={94} h={58} on tone="#0ea5e9" id="b" />
      <Keyboard x={950} w={78} rgb={a} />
    </g>
  ),
  /** Curved ultrawide on an arm, headphones on a stand. */
  ultrawide: ({ a }) => (
    <g>
      <path d="M1094 344 V250 L1060 262" stroke="#2a2c32" strokeWidth={5} fill="none" />
      <rect x={1084} y={338} width={20} height={6} rx={2} fill="#2a2c32" />
      <path d="M902 262 Q990 252 1078 262 V322 Q990 314 902 322 Z" fill="#121318" />
      <path d="M906 266 Q990 257 1074 266 V318 Q990 310 906 318 Z" fill="#1d4ed8" opacity={0.9} className="room-screen" />
      <path d="M920 300 Q960 280 990 296 Q1020 312 1060 288" stroke="#93c5fd" strokeWidth={3} fill="none" opacity={0.6} />
      <Keyboard x={950} w={78} rgb={a} />
      <path d="M906 344 V318 M896 318 Q906 300 916 318" stroke="#2a2c32" strokeWidth={3} fill="none" />
      <rect x={892} y={316} width={8} height={14} rx={3} fill="#2a2c32" />
      <rect x={912} y={316} width={8} height={14} rx={3} fill="#2a2c32" />
    </g>
  ),
  /** Three-screen racing/trading setup. */
  triple: ({ a }) => (
    <g>
      <Stand cx={990} top={300} />
      <path d="M902 300 H1078" stroke="#2a2c32" strokeWidth={5} />
      <Screen x={950} y={252} w={80} h={52} on tone="#16a34a" />
      <g transform="rotate(-8 950 278)">
        <Screen x={872} y={256} w={78} h={50} on tone="#0284c7" id="l" />
      </g>
      <g transform="rotate(8 1030 278)">
        <Screen x={1030} y={256} w={78} h={50} on tone="#7c3aed" id="r" />
      </g>
      <Keyboard x={950} w={78} rgb={a} />
    </g>
  ),
  /** Streamer kit: monitor, boom-arm mic, camera, ring light. */
  streamer: ({ a }) => (
    <g>
      <Stand cx={990} top={318} />
      <Screen x={940} y={262} w={100} h={60} on tone="#db2777" />
      <rect x={980} y={252} width={20} height={9} rx={3} fill="#111" />
      <circle cx={990} cy={256} r={2.5} fill="#38bdf8" />
      <path d="M896 344 V300 L930 270 L952 286" stroke="#2a2c32" strokeWidth={4} fill="none" strokeLinejoin="round" />
      <rect x={948} y={278} width={14} height={24} rx={7} fill="#3b3e46" transform="rotate(30 955 290)" />
      <circle cx={1090} cy={262} r={26} fill="none" stroke="#fff7e6" strokeWidth={6} opacity={0.9} />
      <path d="M1090 288 V344" stroke="#2a2c32" strokeWidth={4} />
      <Keyboard x={954} w={72} rgb={a} />
    </g>
  ),
  /** Retro corner: CRT TV, console and a cartridge stack. */
  retro: ({ c }) => (
    <g>
      <rect x={928} y={250} width={110} height={90} rx={10} fill={c} />
      <rect x={940} y={260} width={80} height={64} rx={14} fill="#1e3a2f" />
      <rect x={946} y={266} width={68} height={52} rx={12} fill="#2f7a5c" opacity={0.9} className="room-screen" />
      <rect x={958} y={284} width={10} height={10} fill="#e8f5e9" opacity={0.8} />
      <rect x={990} y={296} width={12} height={6} fill="#e8f5e9" opacity={0.6} />
      <circle cx={1028} cy={278} r={3} fill={shade(c, 0.4)} />
      <circle cx={1028} cy={292} r={3} fill={shade(c, 0.4)} />
      <rect x={1050} y={322} width={44} height={20} rx={4} fill="#d6d3cd" />
      <rect x={1056} y={316} width={30} height={8} rx={2} fill="#a8a29e" />
      <rect x={900} y={330} width={20} height={14} rx={2} fill="#b91c1c" />
      <rect x={902} y={318} width={20} height={14} rx={2} fill="#1d4ed8" />
    </g>
  ),
};

/* ================================================================ COFFEE TABLES (x 500–640, floor y≈505) */

export const TABLES: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  crate: ({ c }) => (
    <g>
      <Shadow cx={570} cy={506} rx={50} />
      <rect x={530} y={460} width={80} height={44} rx={2} fill={c} />
      {[468, 484].map((y) => (
        <rect key={y} x={534} y={y} width={72} height={10} fill={shade(c, 0.12)} />
      ))}
      <rect x={560} y={448} width={20} height={14} rx={2} fill="#e9e3d6" />
    </g>
  ),
  /** Round wooden coffee table on three legs. */
  round: ({ c }) => (
    <g>
      <Shadow cx={570} cy={508} rx={70} />
      <path d="M528 474 L520 506 M612 474 L620 506 M570 478 V510" stroke={shade(c, 0.3)} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={570} cy={470} rx={66} ry={12} fill={c} />
      <ellipse cx={570} cy={467} rx={66} ry={10} fill={tint(c, 0.12)} />
      <rect x={590} y={452} width={16} height={14} rx={3} fill="#f1ede6" />
      <rect x={540} y={458} width={30} height={6} rx={1} fill="#7c3aed" />
    </g>
  ),
  /** Glass rectangle with a chrome frame. */
  glass: ({ c }) => (
    <g>
      <Shadow cx={570} cy={508} rx={78} o={0.2} />
      <path d="M506 470 H634 L640 478 H500 Z" fill={tint(c, 0.6)} opacity={0.45} />
      <path d="M500 478 H640" stroke="#fff" strokeWidth={1.4} opacity={0.6} />
      <path d="M506 478 V506 M634 478 V506 M506 500 H634" stroke="#cbd0d8" strokeWidth={3} />
      <rect x={548} y={462} width={44} height={8} rx={2} fill="#1f2937" />
    </g>
  ),
  /** Live-edge wood slab on hairpin legs. */
  slab: ({ c }) => (
    <g>
      <Shadow cx={570} cy={508} rx={80} />
      <path d="M514 480 L508 508 M524 480 L530 508 M616 480 L610 508 M626 480 L632 508" stroke="#2d2f35" strokeWidth={3} />
      <path d="M498 468 Q520 462 570 466 Q610 460 642 468 L640 482 H500 Z" fill={c} />
      <path d="M510 472 Q540 468 570 472 Q600 468 630 474" stroke={shade(c, 0.2)} strokeWidth={1.5} fill="none" />
      <circle cx={610} cy={460} r={7} fill="#4ade80" />
      <rect x={606} y={462} width={8} height={8} fill="#e5e7eb" />
    </g>
  ),
  /** Round marble drum table. */
  marble: ({ c }) => (
    <g>
      <Shadow cx={570} cy={510} rx={64} />
      <path d="M520 470 V500 Q570 514 620 500 V470 Z" fill={shade(c, 0.08)} />
      <ellipse cx={570} cy={470} rx={50} ry={10} fill={c} />
      <path d="M534 468 Q560 472 580 464 M590 474 Q604 470 612 472" stroke={shade(c, 0.25)} strokeWidth={1} fill="none" />
      <path d="M560 456 L566 466 H574 L580 456" fill="#d4a63a" />
    </g>
  ),
};
