import type { Diagram } from "@/config/content";

/*
 * Line diagrams for each piece of equipment, drawn in Ice with Signal accents.
 * Every stroke has pathLength=1 so GSAP can draw it in via stroke-dashoffset (`[data-draw]`).
 */

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const signal = { ...stroke, stroke: "#38bdf8" };

function ArchPoints() {
  // Lower dental arch as a captured point cloud
  const pts = Array.from({ length: 34 }, (_, i) => {
    const t = i / 33;
    const a = Math.PI * (1 + t);
    return [100 + 64 * Math.cos(a) * (0.85 + 0.15 * Math.sin(t * Math.PI)), 118 + 70 * Math.sin(a) * 0.82];
  });
  return (
    <>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.4} fill={i < 22 ? "#38bdf8" : "currentColor"} opacity={i < 22 ? 0.95 : 0.45} />
      ))}
      {/* wand + capture beam */}
      <path data-draw pathLength={1} {...stroke} d="M150 22 L178 6 M150 22 l-14 -2 l-2 10 l12 6 Z" />
      <path data-draw pathLength={1} {...signal} d="M138 30 L104 64 M146 34 L122 74" opacity={0.8} />
    </>
  );
}

function SmileArc() {
  const teeth = [-3, -2, -1, 0, 1, 2].map((k) => {
    const w = [16, 19, 24, 24, 19, 16][k + 3];
    const x = 100 + [-58, -40, -22, 2, 26, 45][k + 3];
    const y = 70 + Math.abs(k + 0.5) * 5;
    return { x, y, w };
  });
  return (
    <>
      <path data-draw pathLength={1} {...stroke} d="M30 66 Q100 40 170 66" opacity={0.5} />
      {teeth.map((t, i) => (
        <rect data-draw pathLength={1} key={i} {...stroke} x={t.x} y={t.y} width={t.w - 3} height={34 - Math.abs(i - 2.5) * 3} rx={6} />
      ))}
      <path data-draw pathLength={1} {...signal} d="M34 118 Q100 150 166 118" />
      {[62, 80, 100, 120, 138].map((x) => (
        <path key={x} data-draw pathLength={1} {...signal} d={`M${x} 28 V140`} strokeDasharray="0" opacity={0.35} />
      ))}
    </>
  );
}

function CbctSlices() {
  return (
    <>
      <path data-draw pathLength={1} {...stroke} d="M100 8 L46 52 M100 8 L154 52" opacity={0.45} />
      <circle cx={100} cy={8} r={3} fill="#38bdf8" />
      {[60, 78, 96, 114, 132].map((y, i) => (
        <ellipse
          key={y}
          data-draw
          pathLength={1}
          {...(i === 2 ? signal : stroke)}
          cx={100}
          cy={y}
          rx={56}
          ry={12}
          opacity={i === 2 ? 1 : 0.5}
        />
      ))}
      <path data-draw pathLength={1} {...stroke} d="M44 60 V132 M156 60 V132" opacity={0.35} />
    </>
  );
}

function LaserBeam() {
  return (
    <>
      <path data-draw pathLength={1} {...stroke} d="M20 128 C52 116 72 140 100 128 S150 116 180 128" />
      <path data-draw pathLength={1} {...stroke} d="M20 144 C52 132 72 156 100 144 S150 132 180 144" opacity={0.4} />
      <path data-draw pathLength={1} {...stroke} d="M84 14 h32 v26 h-32 Z" />
      <path data-draw pathLength={1} {...signal} d="M92 40 L100 122 M108 40 L100 122" />
      {[6, 12, 18].map((r) => (
        <circle key={r} data-draw pathLength={1} {...signal} cx={100} cy={124} r={r} opacity={0.9 - r / 30} />
      ))}
    </>
  );
}

function GuideSleeve() {
  return (
    <>
      <path data-draw pathLength={1} {...stroke} d="M30 64 H170 M30 64 V150 M170 64 V150" opacity={0.35} />
      <path data-draw pathLength={1} {...stroke} d="M82 22 h36 v30 h-36 Z" />
      <path data-draw pathLength={1} {...stroke} d="M88 56 h24 l-4 80 h-16 Z" />
      {[68, 80, 92, 104, 116, 128].map((y) => (
        <path key={y} data-draw pathLength={1} {...stroke} d={`M88 ${y} l24 -5`} opacity={0.7} />
      ))}
      <path data-draw pathLength={1} {...signal} d="M100 4 V156" strokeDasharray="0" />
      <path data-draw pathLength={1} {...signal} d="M100 30 A28 28 0 0 1 124 44" />
    </>
  );
}

const diagrams: Record<Diagram, () => React.JSX.Element> = {
  scan: ArchPoints,
  smile: SmileArc,
  cbct: CbctSlices,
  laser: LaserBeam,
  guide: GuideSleeve,
};

export function TechDiagram({ type, className }: { type: Diagram; className?: string }) {
  const Cmp = diagrams[type];
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden>
      <Cmp />
    </svg>
  );
}
