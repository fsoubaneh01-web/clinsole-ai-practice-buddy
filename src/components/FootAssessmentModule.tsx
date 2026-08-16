import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mic, Camera, Send, Sparkles, FileText, X, Image as ImageIcon,
  Ruler, History, BellRing, Stethoscope, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDictation } from "@/hooks/use-dictation";
import plantarAsset from "@/assets/foot-plantar.png.asset.json";
import dorsalAsset from "@/assets/foot-dorsal-toesup-full.png.asset.json";

import { Button } from "@/components/ui/button";
import {
  useStore,
  type FootAssessment,
  type PainLevel,
  type CallusLevel,
  type SkinCondition,
  type WoundMeasurements,
} from "@/lib/store";


/* ────────────────────────────────────────────────────────────
   ClinSole AI — Interactive Foot Assessment
   Anatomical (non-reflexology) clinical regions for foot-care nurses.
   Plantar + dorsal views for both feet with per-region:
     voice dictation · typed notes · photo upload ·
     wound measurements · AI suggestions · treatment history ·
     follow-up reminders.
   ──────────────────────────────────────────────────────────── */

type FootSide = "L" | "R";
type FootView = "plantar" | "dorsal";

type RegionId =
  | "hallux" | "toes" | "metHeads" | "forefoot"
  | "medArch" | "latArch" | "midfoot"
  | "heelPlantar" | "heelMedial" | "heelLateral" | "heelPosterior"
  | "medBorder" | "latBorder"
  | "dorsalFoot" | "ankle";

type RegionGroup =
  | "toes" | "forefoot" | "arch" | "heel"
  | "lateral" | "medial" | "dorsal" | "ankle";

const LEGEND: { group: RegionGroup; label: string; color: string; ring: string }[] = [
  { group: "toes",     label: "Toes",          color: "#A78BFA", ring: "#7C3AED" },
  { group: "forefoot", label: "Forefoot",      color: "#F472B6", ring: "#DB2777" },
  { group: "arch",     label: "Arch / Midfoot",color: "#FBBF24", ring: "#D97706" },
  { group: "heel",     label: "Heel",          color: "#34D399", ring: "#059669" },
  { group: "lateral",  label: "Lateral",       color: "#60A5FA", ring: "#2563EB" },
  { group: "medial",   label: "Medial",        color: "#C4B5FD", ring: "#7C3AED" },
  { group: "dorsal",   label: "Dorsal",        color: "#FCA5A5", ring: "#DC2626" },
  { group: "ankle",    label: "Ankle",         color: "#67E8F9", ring: "#0891B2" },
];

const groupColor = (g: RegionGroup) => LEGEND.find((l) => l.group === g)?.color ?? "#E5E7EB";
const groupRing  = (g: RegionGroup) => LEGEND.find((l) => l.group === g)?.ring  ?? "#6B7280";

type Region = { id: RegionId; label: string; group: RegionGroup; d: string };

/* Right foot, plantar view — viewBox 220 × 530
   Regions tile the foot silhouette; heel is split into 4 clinical zones. */
const PLANTAR_RIGHT: Region[] = [
  { id: "hallux", label: "Hallux", group: "toes",
    d: "M 55 20 Q 25 22 22 55 Q 22 100 32 135 Q 55 148 82 135 Q 90 100 88 55 Q 88 20 55 20 Z" },
  { id: "toes", label: "Toes 2–5", group: "toes",
    d: "M 96 30 Q 108 18 122 26 Q 128 60 124 130 L 96 130 Z \
        M 128 22 Q 142 12 154 22 Q 158 58 152 128 L 128 128 Z \
        M 158 26 Q 170 18 180 30 Q 182 62 174 128 L 158 128 Z \
        M 184 40 Q 196 40 200 62 Q 200 100 190 132 L 174 130 Q 180 96 180 68 Z" },
  { id: "metHeads", label: "Metatarsal heads", group: "forefoot",
    d: "M 12 138 Q 5 165 6 205 L 218 205 Q 220 165 212 138 Z" },
  { id: "forefoot", label: "Plantar forefoot", group: "forefoot",
    d: "M 6 205 L 218 205 L 216 255 L 14 255 Z" },
  { id: "medArch", label: "Medial arch", group: "arch",
    d: "M 15 255 Q 26 305 40 355 L 62 355 Q 48 305 42 255 Z" },
  { id: "midfoot", label: "Midfoot", group: "arch",
    d: "M 42 255 L 170 255 Q 176 305 162 355 L 62 355 Q 48 305 42 255 Z" },
  { id: "latArch", label: "Lateral arch", group: "lateral",
    d: "M 170 255 L 216 255 Q 210 305 198 355 L 162 355 Q 176 305 170 255 Z" },
  { id: "medBorder", label: "Medial border", group: "medial",
    d: "M 8 138 Q 4 175 6 205 Q 11 232 16 255 Q 29 302 40 355 Q 45 402 50 450 \
        L 66 448 Q 60 400 56 355 Q 46 302 32 255 Q 26 232 22 205 Q 20 172 24 140 Z" },
  { id: "latBorder", label: "Lateral border", group: "lateral",
    d: "M 216 138 Q 220 175 219 205 Q 218 232 216 255 Q 210 305 198 355 Q 192 402 180 450 \
        L 164 446 Q 176 400 182 355 Q 194 302 200 255 Q 203 230 203 205 Q 204 172 200 140 Z" },
  /* Heel split: medial / lateral / plantar (weight-bearing) / posterior */
  { id: "heelMedial", label: "Heel · medial", group: "heel",
    d: "M 42 356 L 84 356 Q 86 420 92 470 L 74 476 Q 58 430 50 400 Q 44 375 42 356 Z" },
  { id: "heelLateral", label: "Heel · lateral", group: "heel",
    d: "M 154 356 L 196 356 Q 192 382 186 406 Q 178 440 164 476 L 146 470 Q 152 420 154 356 Z" },
  { id: "heelPlantar", label: "Heel · plantar (weight-bearing)", group: "heel",
    d: "M 84 356 L 154 356 Q 152 420 146 470 L 92 470 Q 86 420 84 356 Z" },
  { id: "heelPosterior", label: "Heel · posterior (Achilles)", group: "heel",
    d: "M 74 476 L 164 476 Q 152 512 110 522 Q 82 514 74 476 Z" },

];

/* Dorsal view — dorsal foot as a broad region + ankle joint & borders */
const DORSAL_RIGHT: Region[] = [
  { id: "hallux", label: "Hallux (nail)", group: "toes",
    d: "M 42 18 Q 25 20 25 50 Q 25 90 34 130 Q 55 142 78 130 Q 88 90 88 50 Q 88 18 42 18 Z" },
  { id: "toes", label: "Toes 2–5 (nails)", group: "toes",
    d: "M 74 32 Q 90 20 106 30 L 108 120 L 74 120 Z \
        M 110 38 Q 126 26 140 38 L 142 120 L 110 120 Z \
        M 144 54 Q 158 44 170 56 L 172 120 L 144 120 Z \
        M 176 80 Q 190 74 200 90 L 202 122 L 176 122 Z" },
  { id: "metHeads", label: "MTP joints", group: "forefoot",
    d: "M 10 124 Q 2 150 3 175 L 217 175 Q 218 150 210 124 Z" },
  { id: "dorsalFoot", label: "Dorsal foot", group: "dorsal",
    d: "M 4 175 L 216 175 Q 210 240 190 305 L 24 305 Q 10 240 4 175 Z" },
  { id: "midfoot", label: "Dorsal midfoot", group: "arch",
    d: "M 24 305 L 190 305 Q 184 334 180 360 L 30 360 Q 27 332 24 305 Z" },
  { id: "medBorder", label: "Medial border", group: "medial",
    d: "M 2 130 Q 0 160 4 190 Q 12 220 18 260 Q 22 310 26 360 Q 24 384 24 400 \
        L 42 400 Q 42 360 40 340 Q 36 300 32 260 Q 26 218 20 188 Q 16 158 18 132 Z" },
  { id: "latBorder", label: "Lateral border", group: "lateral",
    d: "M 216 130 Q 220 160 218 190 Q 212 222 202 260 Q 194 310 180 360 Q 178 382 178 400 \
        L 160 400 Q 162 372 164 356 Q 178 306 186 260 Q 196 220 200 188 Q 202 158 200 132 Z" },

  { id: "heelPosterior", label: "Achilles / posterior heel", group: "heel",
    d: "M 55 355 L 165 355 Q 176 405 165 460 Q 145 495 110 498 Q 75 495 55 460 Q 44 405 55 355 Z" },
  { id: "ankle", label: "Ankle joint", group: "ankle",
    d: "M 60 498 Q 78 514 110 514 Q 142 514 160 498 L 155 490 L 65 490 Z" },
];

const REGIONS: Record<FootView, Region[]> = { plantar: PLANTAR_RIGHT, dorsal: DORSAL_RIGHT };

const SUGGESTIONS_BY_GROUP: Record<RegionGroup, string[]> = {
  toes:     ["Onychomycosis noted", "Ingrown border · L side", "Interdigital maceration", "HAV deformity"],
  forefoot: ["Callus over 1st MTP", "Plantar hyperkeratosis", "Debrided to healthy tissue", "Pressure offloading advised"],
  arch:     ["Pes planus", "Pes cavus", "Plantar fasciitis tenderness", "Windlass test positive"],
  heel:     ["Heel fissure — grade 2", "Emollient applied", "Ulcer margin clean · granulating", "Achilles insertion tender"],
  lateral:  ["5th met head callus", "Tailor's bunion", "Lateral column pain", "Peroneal tendon intact"],
  medial:   ["Tinea pedis (medial)", "Bunion 1st MTP", "Posterior tib tendon intact", "Medial arch fatigue"],
  dorsal:   ["Dorsal edema noted", "Extensor tendon prominent", "Skin intact · warm", "Neuropathic changes"],
  ankle:    ["Pulses palpable ×2", "Cap refill <3s", "1+ pitting edema", "Full ROM · no crepitus"],
};

const FOLLOWUP_PRESETS = [
  { label: "3 d",  days: 3 },
  { label: "1 wk", days: 7 },
  { label: "2 wk", days: 14 },
  { label: "1 mo", days: 30 },
];

const PAIN_LEVELS: PainLevel[] = ["none", "mild", "moderate", "severe"];
const CALLUS_LEVELS: CallusLevel[] = ["none", "mild", "moderate", "severe"];
const SKIN_OPTIONS: SkinCondition[] = ["dry", "moist", "macerated"];

type PendingPhoto = { file: File; url: string };

export function FootAssessmentModule({
  patientId,
  patientName,
  patientMeta,
  onGenerateSoap,
}: {
  patientId?: string;
  patientName: string;
  patientMeta?: string;
  onGenerateSoap?: () => void;
}) {
  const { footAssessments, addFootObservation } = useStore();
  const [view, setView] = useState<FootView>("plantar");
  const [qa, setQa] = useState(false);

  const [selected, setSelected] = useState<{ side: FootSide; region: Region } | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const dictation = useDictation({
    visitId: patientId,
    onTranscript: (text) => setDraft((d) => (d ? `${d.trim()} ${text}` : text)),
  });
  const recording = dictation.status === "recording";

  const [saving, setSaving] = useState(false);
  const [wound, setWound] = useState<WoundMeasurements>({});
  const [pain, setPain] = useState<PainLevel | undefined>();
  const [callus, setCallus] = useState<CallusLevel | undefined>();
  const [skin, setSkin] = useState<SkinCondition[]>([]);
  const [followUp, setFollowUp] = useState<string | undefined>();
  const fileInput = useRef<HTMLInputElement>(null);

  /* Persisted, region-scoped observations for this patient */
  const observations = useMemo(
    () => footAssessments.filter((a) => a.region && (!patientId || a.patientId === patientId)),
    [footAssessments, patientId],
  );

  const regionHistory = useMemo(
    () => selected
      ? observations.filter((o) => o.region === selected.region.id && o.side === selected.side)
      : [],
    [observations, selected],
  );

  const resetPanel = () => {
    setDraft("");
    setPendingPhotos((p) => { p.forEach((x) => URL.revokeObjectURL(x.url)); return []; });
    setWound({});
    setPain(undefined);
    setCallus(undefined);
    setSkin([]);
    setFollowUp(undefined);
  };

  const handleSelect = (side: FootSide, region: Region) => {
    setSelected({ side, region });
    resetPanel();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).slice(0, 4).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPendingPhotos((p) => [...p, ...next].slice(0, 4));
  };

  const toggleSkin = (s: SkinCondition) =>
    setSkin((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const setFollowUpDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUp(d.toISOString());
  };

  const hasMeasurements = wound.length || wound.width || wound.depth;
  const hasClinical = pain || callus || skin.length > 0;

  const save = async () => {
    if (!selected || saving) return;
    if (!draft.trim() && pendingPhotos.length === 0 && !hasMeasurements && !hasClinical && !followUp) return;
    if (!patientId) { toast.error("Choose a patient before saving an observation."); return; }
    setSaving(true);
    const res = await addFootObservation(
      {
        patientId,
        side: selected.side,
        view,
        region: selected.region.id,
        regionLabel: selected.region.label,
        group: selected.region.group,
        text: draft.trim(),
        measurements: hasMeasurements ? wound : undefined,
        pain,
        callus,
        skin: skin.length > 0 ? skin : undefined,
        followUp,
      },
      pendingPhotos.map((p) => p.file),
    );
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(`Saved · ${selected.side} ${selected.region.label}`);
    resetPanel();
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
        <div className="flex shrink-0 flex-col items-end gap-1.5">

          <div className="flex rounded-full bg-muted p-1 text-xs font-medium">
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
          <button
            type="button"
            onClick={() => setQa((q) => !q)}
            aria-pressed={qa}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
              qa ? "border-primary bg-primary text-primary-foreground" : "border-dashed text-muted-foreground",
            )}
          >
            QA overlay {qa ? "on" : "off"}
          </button>
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
        <FootSvg side="L" view={view} selected={selected} onSelect={handleSelect} observations={observations} qa={qa} />
        <FootSvg side="R" view={view} selected={selected} onSelect={handleSelect} observations={observations} qa={qa} />
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
                  Selected · {view}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Treatment history */}
            {regionHistory.length > 0 && (
              <div className="mt-3 rounded-xl border border-dashed bg-muted/40 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <History className="h-3 w-3" /> Treatment history · {regionHistory.length}
                </div>
                <ul className="space-y-1.5">
                  {regionHistory.slice(0, 3).map((h) => (
                    <li key={h.id} className="text-xs text-foreground/85">
                      <span className="mr-1 font-medium text-muted-foreground">
                        {new Date(h.date).toLocaleDateString([], { month: "short", day: "numeric" })}:
                      </span>
                      {h.notes || "(photo / measurement)"}
                      {h.measurements && (
                        <span className="ml-1 text-muted-foreground">
                          · {h.measurements.length ?? "–"}×{h.measurements.width ?? "–"}×{h.measurements.depth ?? "–"} mm
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
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
                placeholder={
                  recording ? "Listening…"
                    : dictation.status === "transcribing" ? `Transcribing… ${dictation.transcribeSeconds}s (usually 10–30s)`
                    : "Type or dictate observation for this region"
                }
                rows={3}
                className="min-h-[76px] flex-1 resize-none rounded-xl border bg-surface p-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={dictation.toggle}
                  disabled={dictation.status === "transcribing" || dictation.status === "requesting" || !dictation.supported || dictation.limitReached}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl shadow-soft transition-colors disabled:opacity-60",
                    recording ? "bg-destructive text-white animate-pulse" : "bg-secondary text-secondary-foreground",
                  )}
                  aria-label="Voice dictation"
                  title={
                    dictation.limitReached
                      ? dictation.limitMessage ?? "Dictation limit reached"
                      : recording ? `Stop recording (${dictation.seconds}s)` : "Voice dictation"
                  }
                >
                  {dictation.status === "transcribing" || dictation.status === "requesting"
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Mic className="h-4 w-4" />}
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

            {dictation.limitMessage && (
              <div className="mt-2 rounded-xl border border-warning/40 bg-warning/10 p-2 text-xs text-foreground">
                {dictation.limitMessage}
              </div>
            )}

            {dictation.error && !dictation.limitReached && (
              <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {dictation.error}
              </div>
            )}




            {/* Pending photos */}
            {pendingPhotos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {pendingPhotos.map((p) => (
                  <div key={p.url} className="relative h-14 w-14 overflow-hidden rounded-lg border">
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Clinical quick-assess: Pain · Skin · Callus */}
            <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border bg-surface p-3 sm:grid-cols-3">
              <FieldGroup label="Pain">
                <div className="flex flex-wrap gap-1">
                  {PAIN_LEVELS.map((p) => (
                    <Chip key={p} active={pain === p} onClick={() => setPain(pain === p ? undefined : p)}>
                      {p}
                    </Chip>
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup label="Skin">
                <div className="flex flex-wrap gap-1">
                  {SKIN_OPTIONS.map((s) => (
                    <Chip key={s} active={skin.includes(s)} onClick={() => toggleSkin(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup label="Callus">
                <div className="flex flex-wrap gap-1">
                  {CALLUS_LEVELS.map((c) => (
                    <Chip key={c} active={callus === c} onClick={() => setCallus(callus === c ? undefined : c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </FieldGroup>
            </div>

            {/* Wound measurements */}
            <div className="mt-3 rounded-xl border bg-surface p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Ruler className="h-3 w-3" /> Wound measurements (mm)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["length", "width", "depth"] as const).map((k) => (
                  <label key={k} className="block">
                    <span className="text-[10px] capitalize text-muted-foreground">{k}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={wound[k] ?? ""}
                      onChange={(e) => setWound((w) => ({ ...w, [k]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                      placeholder="0"
                      className="mt-0.5 w-full rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Follow-up reminder */}
            <div className="mt-3 rounded-xl border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <BellRing className="h-3 w-3" /> Follow-up reminder
                </div>
                {followUp && (
                  <button onClick={() => setFollowUp(undefined)} className="text-[10px] text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {FOLLOWUP_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setFollowUpDays(p.days)}
                    className="rounded-full border bg-background px-2.5 py-1 text-[11px] hover:border-primary/40 hover:text-primary"
                  >
                    +{p.label}
                  </button>
                ))}
                <input
                  type="date"
                  value={followUp ? followUp.slice(0, 10) : ""}
                  onChange={(e) => setFollowUp(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="ml-auto rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:border-primary/40"
                />
              </div>
              {followUp && (
                <div className="mt-2 text-[11px] text-primary">
                  Reminder set · {new Date(followUp).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                </div>
              )}
            </div>

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
                  disabled={!draft.trim() && pendingPhotos.length === 0 && !hasMeasurements && !hasClinical && !followUp}
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
            <Stethoscope className="mx-auto mb-1 h-4 w-4 text-primary" />
            Tap any anatomical region to open the clinical assessment panel.
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
                style={{ background: groupRing((o.regionGroup ?? "skin") as RegionGroup) }}
              >
                {o.side} · {o.regionLabel}
              </span>
              <div className="min-w-0 flex-1">
                {o.notes && <p className="truncate">{o.notes}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {o.photoPaths.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> {o.photoPaths.length}
                    </span>
                  )}
                  {o.measurements && (
                    <span className="inline-flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {o.measurements.length ?? "–"}×{o.measurements.width ?? "–"}×{o.measurements.depth ?? "–"} mm
                    </span>
                  )}
                  {o.followUp && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <BellRing className="h-3 w-3" />
                      {new Date(o.followUp).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(o.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   Photoreal foot base image + tappable region overlays.
   One plantar image and one dorsal image, mirrored for the left foot.
   ──────────────────────────────────────────────────────────── */

function FootSvg({
  side, view, selected, onSelect, observations, qa = false,
}: {
  side: FootSide; view: FootView;
  selected: { side: FootSide; region: Region } | null;
  onSelect: (side: FootSide, region: Region) => void;
  observations: FootAssessment[];
  qa?: boolean;
}) {
  const regions = REGIONS[view];
  const observedIds = new Set(
    observations.filter((o) => o.side === side && o.view === view).map((o) => o.region),
  );
  const baseImage = view === "plantar" ? plantarAsset.url : dorsalAsset.url;
  // Source artwork: the plantar photo is a LEFT foot (hallux on the panel's
  // inner edge). The dorsal photo — shot toes-down — is a RIGHT foot (its
  // hallux sits on the image's own left side), so the RIGHT panel uses it
  // un-mirrored and the LEFT panel mirrors it; that lands the big toe medial
  // on both dorsal feet.
  const sourceSide: FootSide = view === "plantar" ? "L" : "R";
  const mirrored = side !== sourceSide;


  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {side === "L" ? "Left" : "Right"} · {view}
      </div>
      {qa && (
        <div className="mb-1 rounded-md border border-dashed border-primary/60 bg-primary/5 px-1.5 py-0.5 text-center font-mono text-[9px] leading-tight text-primary">
          src: {view} photo = {sourceSide === "L" ? "LEFT" : "RIGHT"} foot
          <br />
          {mirrored
            ? `MIRRORED derivative (scaleX -1) → renders ${side === "L" ? "LEFT" : "RIGHT"} foot`
            : `TRUE SOURCE · un-mirrored → renders ${side === "L" ? "LEFT" : "RIGHT"} foot`}
          {" · "}
          {regions.length} zones
        </div>
      )}
      <div className="relative h-[300px] w-full max-w-[170px] select-none lg:h-[380px] lg:max-w-[200px]">
        {/* One transform owns the complete artwork layer. Keeping the image and
            hit-map transform-free prevents nested mirrors from cancelling. */}
        <div
          data-foot-side={side}
          data-foot-view={view}
          data-mirrored={mirrored ? "true" : "false"}
          className="absolute inset-0"
          style={{
            transform: mirrored ? "translateX(100%) scaleX(-1)" : undefined,
            transformOrigin: "0 0",
          }}
        >
          <img
            src={baseImage}
            alt={`${side === "L" ? "Left" : "Right"} foot, ${view} view`}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,.12))" }}
          />
          <svg
            viewBox="0 0 220 530"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
          {qa && (
            <>
              <rect x="1" y="1" width="218" height="528" fill="none"
                stroke="#DE8A44" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
              {/* Text is counter-mirrored so it stays readable while the
                  artwork around it mirrors. */}
              <text x="110" y="60" textAnchor="middle" fontSize="34" fontWeight="700"
                fontFamily="monospace" fill="#0F172A" opacity="0.55"
                transform={mirrored ? "translate(220,0) scale(-1,1)" : undefined}>
                {side}
              </text>
            </>
          )}
            {/* Zone paths are authored toes-up in right-foot coordinates.
                Plantar source art is a left foot → flip in X.
                Dorsal source art is now the toes-up crop (leg removed): no Y
                flip needed, just the crop scale 971/771 ≈ 1.2594 that stretches
                the original full-length mapping onto the shorter cropped photo.
                The outer artwork transform then mirrors both together.
                The hallux QA marker lives INSIDE this group so it always
                travels with the zone shapes. */}
            <g
              data-zone-coordinate-space={view === "plantar" ? "plantar-left-source" : "dorsal-right-source-toesup"}
              transform={view === "plantar" ? "translate(220 0) scale(-1 1)" : "scale(1 1.2594)"}
            >

            {qa && <circle cx={42} cy={42} r="12" fill="#099292" opacity="0.8" />}


            {regions.map((r) => {

            const isSelected = selected?.side === side && selected.region.id === r.id;
            const wasObserved = observedIds.has(r.id);
            const fill = groupColor(r.group);
            const ring = groupRing(r.group);
            return (
              <g key={r.id} data-region-id={r.id} onClick={() => onSelect(side, r)} className="cursor-pointer">
                <path
                  d={r.d}
                  fill={fill}
                  fillOpacity={qa ? 0.12 : isSelected ? 0.7 : 0.32}
                  stroke={qa ? "#0F172A" : isSelected ? ring : "#FFFFFF"}
                  strokeOpacity={qa ? 0.9 : isSelected ? 1 : 0.7}
                  strokeWidth={qa ? 1.2 : isSelected ? 2.5 : 1}
                  style={{ transition: "fill-opacity .2s, stroke-width .2s" }}
                />
                {isSelected && !qa && (
                  <path d={r.d} fill="none" stroke={ring} strokeWidth="2" opacity="0.5">
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                  </path>
                )}
                {wasObserved && !isSelected && !qa && (
                  <path d={r.d} fill="none" stroke={ring} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
                )}

              </g>
            );
            })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}


function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
