import type { CSSProperties } from "react";
import { useCrossfade } from "@/hooks/use-crossfade";
import { cn } from "@/lib/utils";

type FieldNode = { x: number; y: number; r: number; hub: boolean };
type FieldEdge = { a: number; b: number; opacity: number };
type Field = { nodes: FieldNode[]; edges: FieldEdge[] };

/* Seeded PRNG. The layouts must be identical on the server and in the browser
   or hydration would rewrite the whole field, so nothing here may use
   Math.random. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number, places = 2) => Number(value.toFixed(places));

/**
 * Scatters nodes with a minimum separation, then links each one to its two
 * nearest neighbours — the clustering is what makes it read as a network of
 * records rather than as confetti.
 */
function buildField(seed: number, count = 27): Field {
  const random = mulberry32(seed);
  const nodes: FieldNode[] = [];

  for (let i = 0; i < count; i += 1) {
    let x = 0;
    let y = 0;
    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt += 1) {
      x = 70 + random() * 660;
      y = 70 + random() * 660;
      placed = nodes.every((n) => (n.x - x) ** 2 + (n.y - y) ** 2 > 88 * 88);
    }
    const hub = random() < 0.18;
    nodes.push({ x: round(x), y: round(y), r: round(hub ? 5.5 : 2 + random() * 2.2), hub });
  }

  const edges: FieldEdge[] = [];
  const seen = new Set<string>();
  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({ j, distance: Math.hypot(other.x - node.x, other.y - node.y) }))
      .filter((candidate) => candidate.j !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    for (const candidate of nearest) {
      if (candidate.distance > 265) continue;
      const key = i < candidate.j ? `${i}-${candidate.j}` : `${candidate.j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: i, b: candidate.j, opacity: round(0.7 - candidate.distance / 640, 3) });
    }
  });

  return { nodes, edges };
}

const FIELDS = [buildField(11), buildField(29), buildField(47)];
const DRIFTS = ["a", "b", "c"] as const;
const DRIFT_DURATIONS = ["34s", "39s", "36s"];

/**
 * The hero motif: a field of linked nodes standing in for connected care
 * records. Three arrangements dissolve into one another on the same hold and
 * fade rhythm as the rest of the page, each drifting continuously underneath.
 *
 * A radial mask fades the field out before it reaches the frame, so the drift
 * never clips a node against a hard edge on the open beige ground.
 */
export function CareField({ className }: { className?: string }) {
  const { ref, index, reducedMotion } = useCrossfade(FIELDS.length, 9000);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="An abstract field of connected points, suggesting linked patient records"
      data-motion={reducedMotion ? "off" : "on"}
      className={cn("clin-stage aspect-square w-full", className)}
    >
      {FIELDS.map((field, i) => (
        <div key={i} className="clin-stage__slide" data-active={i === index}>
          <div
            className="clin-stage__drift"
            data-drift={DRIFTS[i % DRIFTS.length]}
            style={
              { "--drift-duration": DRIFT_DURATIONS[i % DRIFT_DURATIONS.length] } as CSSProperties
            }
          >
            <FieldSvg field={field} id={`care-field-${i}`} delaySeconds={i * 4} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldSvg({ field, id, delaySeconds }: { field: Field; id: string; delaySeconds: number }) {
  return (
    <svg viewBox="0 0 800 800" className="h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-warmth`}>
          <stop offset="0%" stopColor="#FBF4E3" />
          <stop offset="70%" stopColor="#F7F1E3" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F5F0E6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-falloff`}>
          <stop offset="62%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="800" height="800" fill={`url(#${id}-falloff)`} />
        </mask>
      </defs>

      <circle cx="400" cy="380" r="330" fill={`url(#${id}-warmth)`} />

      <g mask={`url(#${id}-mask)`}>
        <g
          className="canvas-breathe"
          stroke="var(--canvas-signal)"
          strokeWidth="1.1"
          style={{ animationDelay: `${delaySeconds}s` }}
        >
          {field.edges.map((edge) => {
            const a = field.nodes[edge.a];
            const b = field.nodes[edge.b];
            return (
              <line
                key={`${edge.a}-${edge.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeOpacity={edge.opacity}
              />
            );
          })}
        </g>

        {field.nodes.map((node, i) =>
          node.hub ? (
            <g key={i}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 7}
                fill="none"
                stroke="var(--canvas-signal)"
                strokeOpacity="0.5"
              />
              <circle cx={node.x} cy={node.y} r={node.r} fill="var(--canvas-signal-deep)" />
            </g>
          ) : (
            <circle
              key={i}
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill="var(--canvas-signal)"
              fillOpacity="0.9"
            />
          ),
        )}
      </g>
    </svg>
  );
}
