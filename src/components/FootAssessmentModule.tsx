import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Camera, Send, Sparkles, FileText, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ────────────────────────────────────────────────────────────
   Anatomical foot assessment — SVG regions with legend colors
   ──────────────────────────────────────────────────────────── */

type FootSide = "L" | "R";
type FootView = "plantar" | "dorsal";

type RegionId =
  | "hallux" | "toes" | "forefoot" | "metHeads"
  | "medArch" | "latArch" | "midfoot"
  | "heel" | "medBorder" | "latBorder" | "ankle";

type RegionGroup = "toes" | "forefoot" | "arch" | "heel" | "lateral" | "medial" | "ankle";

const LEGEND: { group: RegionGroup; label: string; color: string; ring: string }[] = [
  { group: "toes",     label: "Toes",     color: "#A78BFA", ring: "#7C3AED" },
  { group: "forefoot", label: "Forefoot", color: "#F472B6", ring: "#DB2777" },
  { group: "arch",     label: "Arch",     color: "#FBBF24", ring: "#D97706" },
  { group: "heel",     label: "Heel",     color: "#34D399", ring: "#059669" },
  { group: "lateral",  label: "Lateral",  color: "#60A5FA", ring: "#2563EB" },
  { group: "medial",   label: "Medial",   color: "#C4B5FD", ring: "#7C3AED" },
];

const groupColor = (g: RegionGroup) => LEGEND.find((l) => l.group === g)?.color ?? "#E5E7EB";
const groupRing  = (g: RegionGroup) => LEGEND.find((l) => l.group === g)?.ring  ?? "#6B7280";

type Region = { id: RegionId; label: string; group: RegionGroup; d: string };

/* Right foot, plantar view — viewBox 220 × 520
   Regions are drawn as filled shapes that tile the foot silhouette.        */
const PLANTAR_RIGHT: Region[] = [
  { id: "hallux", label: "Hallux", group: "toes",
    d: "M 55 20 Q 25 22 22 55 Q 22 100 32 135 Q 55 148 82 135 Q 90 100 88 55 Q 88 20 55 20 Z" },
  { id: "toes", label: "Toes 2-5", group: "toes",
    d: "M 96 30 Q 108 18 122 26 Q 128 60 124 130 L 96 130 Z \
        M 128 22 Q 142 12 154 22 Q 158 58 152 128 L 128 128 Z \
        M 158 26 Q 170 18 180 30 Q 182 62 174 128 L 158 128 Z \
        M 184 40 Q 196 40 200 62 Q 200 100 190 132 L 174 130 Q 180 96 180 68 Z" },
  { id: "metHeads", label: "Metatarsal heads", group: "forefoot",
    d: "M 32 138 Q 22 148 22 170 Q 24 195 40 205 L 180 205 Q 196 195 198 170 Q 198 148 188 138 Z" },
  { id: "forefoot", label: "Forefoot", group: "forefoot",
    d: "M 22 205 Q 20 235 32 255 L 188 255 Q 200 235 198 205 Z" },
  { id: "medArch", label: "Medial arch", group: "arch",
    d: "M 32 255 Q 30 285 40 315 L 40 355 Q 22 355 20 320 Q 18 285 32 255 Z" },
  { id: "midfoot", label: "Midfoot", group: "arch",
    d: "M 40 255 L 158 255 L 158 355 L 40 355 Z" },
  { id: "latArch", label: "Lateral arch", group: "lateral",
    d: "M 158 255 Q 195 260 198 300 Q 200 335 180 355 L 158 355 Z" },
  { id: "medBorder", label: "Medial border", group: "medial",
    d: "M 22 138 L 32 138 L 32 255 L 22 255 Z \
        M 20 355 L 40 355 L 40 400 L 22 400 Z" },
  { id: "latBorder", label: "Lateral border", group: "lateral",
    d: "M 188 138 L 200 138 L 198 255 L 188 255 Z \
        M 180 355 L 200 355 L 200 400 L 178 400 Z" },
  { id: "heel", label: "Heel", group: "heel",
    d: "M 40 355 L 158 355 L 178 400 Q 180 460 145 495 Q 110 510 75 495 Q 40 460 42 400 Z" },
  { id: "ankle", label: "Ankle", group: "ankle",
    d: "M 70 495 Q 78 512 110 512 Q 142 512 150 495 L 150 490 L 70 490 Z" },
];

/* Dorsal view — narrower toes, tendon strip along top of foot */
const DORSAL_RIGHT: Region[] = [
  { id: "hallux", label: "Hallux (nail)", group: "toes",
    d: "M 42 18 Q 25 20 25 50 Q 25 90 34 130 Q 55 142 78 130 Q 88 90 88 50 Q 88 18 42 18 Z" },
  { id: "toes", label: "Toes 2-5 (nails)", group: "toes",
    d: "M 96 26 Q 108 14 122 22 Q 128 56 124 128 L 96 128 Z \
        M 128 20 Q 142 10 154 20 Q 158 54 152 126 L 128 126 Z \
        M 158 24 Q 170 16 180 28 Q 182 60 174 126 L 158 126 Z \
        M 184 38 Q 196 40 200 60 Q 200 98 190 130 L 174 128 Q 180 94 180 66 Z" },
  { id: "metHeads", label: "MTP joints", group: "forefoot",
    d: "M 32 135 Q 22 148 24 175 L 196 175 Q 198 148 188 135 Z" },
  { id: "forefoot", label: "Dorsal forefoot", group: "forefoot",
    d: "M 24 175 Q 24 220 40 250 L 180 250 Q 196 220 196 175 Z" },
  { id: "midfoot", label: "Dorsal midfoot", group: "arch",
    d: "M 40 250 Q 42 300 55 355 L 165 355 Q 178 300 180 250 Z" },
  { id: "medBorder", label: "Medial border", group: "medial",
    d: "M 22 135 L 32 135 L 40 250 L 22 250 Z \
        M 22 250 L 40 250 L 55 355 L 30 355 Z" },
  { id: "latBorder", label: "Lateral border", group: "lateral",
    d: "M 188 135 L 198 135 L 196 250 L 180 250 Z \
        M 180 250 L 198 250 L 190 355 L 165 355 Z" },
  { id: "heel", label: "Achilles / heel", group: "heel",
    d: "M 55 355 L 165 355 Q 176 405 165 460 Q 145 495 110 498 Q 75 495 55 460 Q 44 405 55 355 Z" },
  { id: "ankle", label: "Ankle joint", group: "ankle",
    d: "M 60 498 Q 78 514 110 514 Q 142 514 160 498 L 155 490 L 65 490 Z" },
];

const REGIONS: Record<FootView, Region[]> = { plantar: PLANTAR_RIGHT, dorsal: DORSAL_RIGHT };

const SUGGESTIONS_BY_GROUP: Record<RegionGroup, string[]> = {
  toes:     ["Onychomycosis noted", "Ingrown border · L side", "Interdigital maceration", "HAV deformity"],
  forefoot: ["Callus over 1st MTP", "Plantar hyperkeratosis", "Debrided to healthy tissue", "Pressure offloading advised"],
  arch:     ["Pes planus", "Pes cavus", "Plantar fasciitis tenderness", "Windlass test positive"],
  heel:     ["Heel fissure — grade 2", "Emollient applied", "Cracked skin, no bleeding", "Achilles insertion tender"],
  lateral:  ["5th met head callus", "Tailor's bunion", "Lateral column pain", "Peroneal tendon intact"],
  medial:   ["Tinea pedis (medial)", "Bunion 1st MTP", "Posterior tib tendon intact", "Medial arch fatigue"],
  ankle:    ["Pulses palpable ×2", "Cap refill <3s", "1+ pitting edema", "Full ROM · no crepitus"],
};

export type FootObservation = {
  id: string;
  side: FootSide;
  view: FootView;
  region: RegionId;
  regionLabel: string;
  group: RegionGroup;
  text: string;
  photos: string[]; // object URLs
  at: string;
};

export function FootAssessmentModule({
  patientName,
  patientMeta,
  observations,
  onSave,
  onGenerateSoap,
}: {
  patientName: string;
  patientMeta?: string;
  observations: FootObservation[];
  onSave: (obs: FootObservation) => void;
  onGenerateSoap?: () => void;
}) {
  const [view, setView] = useState<FootView>("plantar");
  const [selected, setSelected] = useState<{ side: FootSide; region: Region } | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const recentForRegion = useMemo(
    () => selected ? observations.find((o) => o.region === selected.region.id && o.side === selected.side) : undefined,
    [observations, selected],
  );

  const handleSelect = (side: FootSide, region: Region) => {
    setSelected({ side, region });
    setDraft("");
    setPendingPhotos([]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files).slice(0, 4).map((f) => URL.createObjectURL(f));
    setPendingPhotos((p) => [...p, ...urls].slice(0, 4));
  };

  const save = () => {
    if (!selected || (!draft.trim() && pendingPhotos.length === 0)) return;
    onSave({
      id: crypto.randomUUID(),
      side: selected.side,
      view,
      region: selected.region.id,
      regionLabel: selected.region.label,
      group: selected.region.group,
      text: draft.trim(),
      photos: pendingPhotos,
      at: new Date().toISOString(),
    });
    setDraft("");
    setPendingPhotos([]);
  };

  const suggestions = selected ? SUGGESTIONS_BY_GROUP[selected.region.group] : [];

  return (
    <section className="rounded-3xl border bg-surface p-5 shadow-card lg:p-6">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Active session</div>
          <h2 className="mt-0.5 truncate text-lg font-bold lg:text-xl">Foot assessment · {patientName}</h2>
          {patientMeta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{patientMeta}</p>}
        </div>
        <div className="flex shrink-0 rounded-full bg-muted p-1 text-xs font-medium">
          {(["plantar", "dorsal"] as FootView[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelected(null); }}
              className={cn(
                "rounded-full px-3 py-1.5 capitalize transition-colors",
                view === v ? "bg-surface text-primary shadow-soft" : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
        {LEGEND.map((l) => (
          <span key={l.group} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Feet */}
      <div
        className="mt-4 grid grid-cols-2 gap-3 rounded-2xl p-4"
        style={{ background: "linear-gradient(180deg,#F5F7FB 0%,#EAF0F5 100%)" }}
      >
        <FootSvg side="L" view={view} selected={selected} onSelect={handleSelect} observations={observations} />
        <FootSvg side="R" view={view} selected={selected} onSelect={handleSelect} observations={observations} />
      </div>

      {/* Assessment panel */}
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={`${selected.side}-${selected.region.id}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="mt-5 rounded-2xl border bg-background p-4"
          >
            {/* Selected location */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{ background: groupRing(selected.region.group) }}
                >
                  {selected.side} · {selected.region.label}
                </span>
                <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                  Selected location · {view}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Recent observation */}
            {recentForRegion && (
              <div className="mt-3 rounded-xl border border-dashed bg-muted/40 p-3 text-xs">
                <div className="font-semibold uppercase tracking-wider text-muted-foreground">Recent observation</div>
                <div className="mt-1 text-foreground">{recentForRegion.text || "(photo only)"}</div>
              </div>
            )}

            {/* AI suggestions */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" /> AI clinical suggestions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setDraft((d) => (d ? `${d}. ${s}` : s))}
                    className="rounded-full border bg-surface px-2.5 py-1 text-[11px] text-foreground/80 hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea + controls */}
            <div className="mt-3 flex items-stretch gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={recording ? "Listening…" : "Type or dictate observation for this region"}
                rows={3}
                className="min-h-[76px] flex-1 resize-none rounded-xl border bg-surface p-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setRecording((r) => !r)}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl shadow-soft transition-colors",
                    recording ? "bg-destructive text-white animate-pulse" : "bg-secondary text-secondary-foreground",
                  )}
                  aria-label="Voice dictation"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => fileInput.current?.click()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-foreground shadow-soft hover:bg-muted/70"
                  aria-label="Add photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            </div>

            {/* Pending photos */}
            {pendingPhotos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {pendingPhotos.map((src) => (
                  <div key={src} className="relative h-14 w-14 overflow-hidden rounded-lg border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground">Saves to today's assessment</div>
              <div className="flex gap-2">
                {onGenerateSoap && (
                  <Button size="sm" variant="outline" onClick={onGenerateSoap}>
                    <FileText className="mr-1 h-4 w-4" /> Generate SOAP
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={save}
                  disabled={!draft.trim() && pendingPhotos.length === 0}
                  className="gradient-primary text-primary-foreground"
                >
                  <Send className="mr-1 h-4 w-4" /> Save observation
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground"
          >
            Tap any anatomical region to open the assessment panel.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session log */}
      {observations.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Today's observations · {observations.length}
          </div>
          {observations.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-start gap-3 rounded-xl border bg-surface p-3 text-sm">
              <span
                className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: groupRing(o.group) }}
              >
                {o.side} · {o.regionLabel}
              </span>
              <div className="min-w-0 flex-1">
                {o.text && <p className="truncate">{o.text}</p>}
                {o.photos.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ImageIcon className="h-3 w-3" /> {o.photos.length} photo{o.photos.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(o.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   SVG foot — right foot drawn natively; left mirrored
   ──────────────────────────────────────────────────────────── */

function FootSvg({
  side, view, selected, onSelect, observations,
}: {
  side: FootSide; view: FootView;
  selected: { side: FootSide; region: Region } | null;
  onSelect: (side: FootSide, region: Region) => void;
  observations: FootObservation[];
}) {
  const regions = REGIONS[view];
  const observedIds = new Set(observations.filter((o) => o.side === side).map((o) => o.region));
  const outline =
    "M 55 15 Q 22 18 20 55 L 22 135 Q 15 150 18 205 Q 20 250 32 262 \
     Q 40 300 40 355 Q 22 400 42 470 Q 65 512 110 514 Q 155 512 178 470 \
     Q 198 400 180 355 Q 180 300 188 262 Q 200 250 202 205 Q 205 150 198 135 \
     L 200 55 Q 198 18 165 15 Z";

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {side === "L" ? "Left" : "Right"} · {view}
      </div>
      <svg
        viewBox="0 0 220 530"
        className="h-[300px] w-full max-w-[170px] select-none lg:h-[380px] lg:max-w-[200px]"
        style={{ transform: side === "L" ? "scaleX(-1)" : undefined }}
      >
        <defs>
          <filter id={`shadow-${side}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Skin base */}
        <path d={outline} fill="#FDF4EC" stroke="#D8C4B4" strokeWidth="1.5" filter={`url(#shadow-${side})`} />

        {/* Colored anatomical regions */}
        <g>
          {regions.map((r) => {
            const isSelected = selected?.side === side && selected.region.id === r.id;
            const wasObserved = observedIds.has(r.id);
            const fill = groupColor(r.group);
            const ring = groupRing(r.group);
            return (
              <g key={r.id} onClick={() => onSelect(side, r)} className="cursor-pointer">
                <path
                  d={r.d}
                  fill={fill}
                  fillOpacity={isSelected ? 0.95 : 0.55}
                  stroke={isSelected ? ring : "#FFFFFF"}
                  strokeOpacity={isSelected ? 1 : 0.85}
                  strokeWidth={isSelected ? 2.5 : 1}
                  style={{ transition: "fill-opacity .2s, stroke-width .2s" }}
                />
                {/* Selection pulse */}
                {isSelected && (
                  <path d={r.d} fill="none" stroke={ring} strokeWidth="2" opacity="0.5">
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                  </path>
                )}
                {/* Observed marker */}
                {wasObserved && !isSelected && (
                  <path d={r.d} fill="none" stroke={ring} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
                )}
              </g>
            );
          })}
        </g>

        {/* Outline overlay for crisp edge */}
        <path d={outline} fill="none" stroke="#8B7361" strokeWidth="1.2" strokeOpacity="0.6" pointerEvents="none" />
      </svg>
    </div>
  );
}
