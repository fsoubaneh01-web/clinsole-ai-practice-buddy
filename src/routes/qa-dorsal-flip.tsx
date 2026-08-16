import { createFileRoute } from "@tanstack/react-router";
import dorsalAsset from "@/assets/foot-dorsal.png.asset.json";
import dorsalToesUp from "@/assets/foot-dorsal-toesup.png";

export const Route = createFileRoute("/qa-dorsal-flip")({
  component: QaDorsalFlip,
  head: () => ({
    meta: [
      { title: "QA · Dorsal orientation preview" },
      { name: "description", content: "Internal preview comparing toes-down and toes-up dorsal foot panels." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Zone = { id: string; label: string; d: string; color: string };

const C = {
  toes: "#099292",
  forefoot: "#2E7D32",
  dorsal: "#DE8A44",
  arch: "#6366F1",
  medial: "#0EA5E9",
  lateral: "#A855F7",
  heel: "#EF4444",
  ankle: "#F59E0B",
};

const DORSAL_RIGHT: Zone[] = [
  { id: "hallux", label: "Hallux", color: C.toes,
    d: "M 42 18 Q 25 20 25 50 Q 25 90 34 130 Q 55 142 78 130 Q 88 90 88 50 Q 88 18 42 18 Z" },
  { id: "toes", label: "Toes 2-5", color: C.toes,
    d: "M 74 32 Q 90 20 106 30 L 108 120 L 74 120 Z M 110 38 Q 126 26 140 38 L 142 120 L 110 120 Z M 144 54 Q 158 44 170 56 L 172 120 L 144 120 Z M 176 80 Q 190 74 200 90 L 202 122 L 176 122 Z" },
  { id: "metHeads", label: "MTP", color: C.forefoot,
    d: "M 10 124 Q 2 150 3 175 L 217 175 Q 218 150 210 124 Z" },
  { id: "dorsalFoot", label: "Dorsal foot", color: C.dorsal,
    d: "M 4 175 L 216 175 Q 210 240 190 305 L 24 305 Q 10 240 4 175 Z" },
  { id: "midfoot", label: "Midfoot", color: C.arch,
    d: "M 24 305 L 190 305 Q 184 334 180 360 L 30 360 Q 27 332 24 305 Z" },
  { id: "medBorder", label: "Medial", color: C.medial,
    d: "M 2 130 Q 0 160 4 190 Q 12 220 18 260 Q 22 310 26 360 Q 24 384 24 400 L 42 400 Q 42 360 40 340 Q 36 300 32 260 Q 26 218 20 188 Q 16 158 18 132 Z" },
  { id: "latBorder", label: "Lateral", color: C.lateral,
    d: "M 216 130 Q 220 160 218 190 Q 212 222 202 260 Q 194 310 180 360 Q 178 382 178 400 L 160 400 Q 162 372 164 356 Q 178 306 186 260 Q 196 220 200 188 Q 202 158 200 132 Z" },
  { id: "heelPosterior", label: "Achilles", color: C.heel,
    d: "M 55 355 L 165 355 Q 176 405 165 460 Q 145 495 110 498 Q 75 495 55 460 Q 44 405 55 355 Z" },
  { id: "ankle", label: "Ankle", color: C.ankle,
    d: "M 60 498 Q 78 514 110 514 Q 142 514 160 498 L 155 490 L 65 490 Z" },
];

/* Cropped source is 771 of 971 rows → zone space compresses by this factor. */
const CROP_SCALE = 971 / 771;

function Panel({
  side,
  mode,
}: {
  side: "L" | "R";
  mode: "current" | "proposed";
}) {
  const mirrored = side === "L";
  const img = mode === "current" ? dorsalAsset.url : dorsalToesUp;
  const zoneTransform =
    mode === "current"
      ? "translate(0 530) scale(1 -1)"
      : `scale(1 ${CROP_SCALE})`;

  return (
    <div className="relative w-[170px] overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ aspectRatio: "220 / 530" }}>
      <div
        className="absolute inset-0"
        style={{ transform: mirrored ? "translateX(100%) scaleX(-1)" : undefined, transformOrigin: "0 0" }}
      >
        <img src={img} alt={`${side} dorsal ${mode}`} className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
        <svg viewBox="0 0 220 530" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <rect x="1" y="1" width="218" height="528" fill="none" stroke="#DE8A44" strokeWidth="2" strokeDasharray="6 4" />
          <text x="110" y="60" textAnchor="middle" fontSize="34" fontWeight="700" fontFamily="monospace" fill="#0F172A" opacity="0.5"
            transform={mirrored ? "translate(220,0) scale(-1,1)" : undefined}>{side}</text>
          <g transform={zoneTransform}>
            <circle cx={42} cy={42} r="12" fill="#099292" opacity="0.8" />
            {DORSAL_RIGHT.map((z) => (
              <path key={z.id} d={z.d} fill={z.color} fillOpacity={0.14} stroke="#0F172A" strokeOpacity={0.85} strokeWidth={1.2} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function QaDorsalFlip() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] p-4">
      <h1 className="mb-1 text-lg font-semibold">Dorsal orientation preview</h1>
      <p className="mb-4 text-xs text-muted-foreground">
        Left group: current (toes-down). Right group: proposed (toes-up, leg cropped). Nothing in the app changed.
      </p>
      <div className="flex flex-wrap gap-8">
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider">Current · toes-down</div>
          <div className="flex gap-2">
            <Panel side="L" mode="current" />
            <Panel side="R" mode="current" />
          </div>
        </section>
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider">Proposed · toes-up (cropped)</div>
          <div className="flex gap-2">
            <Panel side="L" mode="proposed" />
            <Panel side="R" mode="proposed" />
          </div>
        </section>
      </div>
    </main>
  );
}
