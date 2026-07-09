import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle, Bell, ChevronRight, Droplet, FileText, Flame,
  GraduationCap, Mic, MoreHorizontal, Send, Sparkles, Stethoscope,
  ThermometerSun, X, Plus, Activity, Heart, ClipboardList, Footprints,
  MessageSquare, ChevronLeft, Check,
} from "lucide-react";

// ============================================================================
// Types & data
// ============================================================================

type FootSide = "left" | "right";
type FootView = "plantar" | "dorsal";
type Zone =
  | "heel" | "arch" | "forefoot" | "toes" | "hallux"
  | "plantar" | "dorsal" | "medial" | "lateral" | "ankle";

type Category =
  | "Skin" | "Nails" | "Vascular" | "Neurological"
  | "Musculoskeletal" | "Treatment" | "Plan";

type ConditionContext = "diabetes" | "nailCare" | "woundCare" | "general";

type Observation = {
  id: string;
  side: FootSide;
  zone: Zone;
  category: Category;
  text: string;
  source: "voice" | "text" | "chip";
  createdAt: number;
};

type Alert = {
  id: string;
  severity: "info" | "warn" | "high" | "urgent";
  title: string;
  detail: string;
};

type RiskLevel = "stable" | "monitoring" | "followup" | "urgent";

type Visit = {
  id: string;
  date: string;
  treatment: string;
  risk: RiskLevel;
  provider: string;
  summary: string;
  soap: { s: string; o: string; a: string; p: string };
  photos: number;
  billing: string;
  followUp: string;
};

const ZONE_LABEL: Record<Zone, string> = {
  heel: "Heel", arch: "Arch", forefoot: "Forefoot", toes: "Toes",
  hallux: "Hallux", plantar: "Plantar surface", dorsal: "Dorsal surface",
  medial: "Medial side", lateral: "Lateral side", ankle: "Ankle",
};

const ZONE_TO_CATEGORY: Record<Zone, Category> = {
  heel: "Skin", arch: "Musculoskeletal", forefoot: "Skin", toes: "Skin",
  hallux: "Nails", plantar: "Skin", dorsal: "Vascular",
  medial: "Musculoskeletal", lateral: "Musculoskeletal", ankle: "Vascular",
};

const CHIP_SETS: Record<ConditionContext, string[]> = {
  diabetes: [
    "Reduced protective sensation",
    "Pedal pulses palpable",
    "Skin intact, no ulceration",
    "Monofilament 8/10 sites",
    "Patient education provided",
  ],
  nailCare: [
    "Thickened nails (onychauxis)",
    "Yellow discolouration",
    "Fungal appearance",
    "Ingrown nail — lateral border",
    "Debridement completed",
  ],
  woundCare: [
    "Serous drainage, minimal",
    "Wound bed: granulation tissue",
    "No odour",
    "Peri-wound skin intact",
    "No signs of infection",
    "Dressing changed",
  ],
  general: [
    "Callus present",
    "Dry fissured skin",
    "Moisturizer applied",
    "Well-fitting footwear",
    "Follow-up in 4-6 weeks",
  ],
};

const CONDITION_LABEL: Record<ConditionContext, string> = {
  diabetes: "Diabetes protocol",
  nailCare: "Nail care",
  woundCare: "Wound care",
  general: "General foot care",
};

const INITIAL_ALERTS: Alert[] = [
  { id: "a1", severity: "urgent", title: "Left heel worsening", detail: "Fissure depth increased from 2mm → 4mm across last 3 visits." },
  { id: "a2", severity: "high", title: "High diabetic risk", detail: "HbA1c 9.2, sensation reduced. Escalate to podiatrist review." },
  { id: "a3", severity: "warn", title: "Overdue follow-up", detail: "Scheduled 6 days ago. Book next visit or flag for outreach." },
  { id: "a4", severity: "warn", title: "Vascular assessment missing", detail: "Last documented pedal pulses > 90 days ago." },
  { id: "a5", severity: "info", title: "Recurring fungal infection", detail: "3rd episode in 6 months — consider culture." },
];

const INITIAL_TIMELINE: Visit[] = [
  {
    id: "v1", date: "Today", treatment: "Diabetic foot check + debridement",
    risk: "followup", provider: "Nurse Alina",
    summary: "Left heel fissure deepening. Callus reduced. Education reinforced.",
    soap: {
      s: "Reports mild burning L heel. Denies acute pain.",
      o: "L heel: 4mm fissure, no exudate. R foot intact. Pulses palpable.",
      a: "Progressing fissure secondary to xerosis + diabetes.",
      p: "Emollient BID, offload heel, review 2 wks.",
    },
    photos: 3, billing: "$85 — DFC + debridement", followUp: "In 14 days",
  },
  {
    id: "v2", date: "3 wks ago", treatment: "Nail reduction + callus care",
    risk: "monitoring", provider: "Nurse Alina",
    summary: "Nails debrided. Bilateral callus over MTPJs. No new lesions.",
    soap: {
      s: "Comfortable, no pain.",
      o: "Nails thickened, reduced. Callus 1st MTPJ bilateral.",
      a: "Stable maintenance visit.",
      p: "Filing PRN, moisturizer, review 4 wks.",
    },
    photos: 2, billing: "$65", followUp: "Booked",
  },
  {
    id: "v3", date: "6 wks ago", treatment: "Initial assessment",
    risk: "stable", provider: "Nurse Alina",
    summary: "Baseline diabetic foot screen. Low-moderate risk. Plan set.",
    soap: {
      s: "New patient, hx PVD + T2DM 12 yrs.",
      o: "Bilateral pulses palpable. Monofilament 10/10.",
      a: "Low-moderate risk foot status.",
      p: "Quarterly reviews. Education pack.",
    },
    photos: 4, billing: "$110", followUp: "Complete",
  },
  {
    id: "v4", date: "3 mo ago", treatment: "Fungal treatment initiated",
    risk: "urgent", provider: "Nurse Alina",
    summary: "Onychomycosis confirmed. Topical antifungal started.",
    soap: {
      s: "Discolouration & thickening R hallux.",
      o: "Yellow subungual debris R hallux.",
      a: "Onychomycosis — R hallux.",
      p: "Topical antifungal 12 wks, review monthly.",
    },
    photos: 1, billing: "$70", followUp: "Complete",
  },
];

const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  stable:     { label: "Stable",         color: "#2CB1A1", bg: "#DDF3EF" },
  monitoring: { label: "Monitoring",     color: "#F5A524", bg: "#FEF3D6" },
  followup:   { label: "Needs follow-up", color: "#F97316", bg: "#FEE7D2" },
  urgent:     { label: "Urgent review",  color: "#E5484D", bg: "#FCE1E2" },
};

const SEVERITY_META: Record<Alert["severity"], { color: string; bg: string; icon: React.ReactNode }> = {
  urgent: { color: "#E5484D", bg: "#FCE1E2", icon: <Flame size={13} /> },
  high:   { color: "#F97316", bg: "#FEE7D2", icon: <AlertTriangle size={13} /> },
  warn:   { color: "#B45309", bg: "#FEF3D6", icon: <Bell size={13} /> },
  info:   { color: "#3F8CFF", bg: "#E5F0FF", icon: <Activity size={13} /> },
};

// ============================================================================
// Root
// ============================================================================

export function ClinicalDashboard() {
  const [footView, setFootView] = useState<FootView>("plantar");
  const [selected, setSelected] = useState<{ side: FootSide; zone: Zone } | null>(null);
  const [observations, setObservations] = useState<Observation[]>([
    { id: "o1", side: "left", zone: "heel", category: "Skin", text: "Dry fissured skin with mild callus.", source: "voice", createdAt: Date.now() - 4 * 60_000 },
    { id: "o2", side: "right", zone: "hallux", category: "Nails", text: "Thickened nail with yellow discolouration.", source: "text", createdAt: Date.now() - 12 * 60_000 },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [openAlert, setOpenAlert] = useState<Alert | null>(null);
  const [openVisit, setOpenVisit] = useState<Visit | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const conditionContext: ConditionContext = "diabetes"; // patient-driven in real app

  const addObservation = (obs: Omit<Observation, "id" | "createdAt">) => {
    setObservations((prev) => [
      { ...obs, id: `o${Date.now()}`, createdAt: Date.now() },
      ...prev,
    ]);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setOpenAlert(null);
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-5">
      <BrandHeader />
      <ClinicalSummary />
      <SmartAlerts alerts={alerts} onOpen={setOpenAlert} />

      <section className="rounded-2xl bg-card border border-[color:var(--border)] shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Foot assessment</h2>
            <p className="text-[11px] text-muted-foreground">Tap a zone to dictate an observation</p>
          </div>
          <ViewToggle value={footView} onChange={setFootView} />
        </div>
        <FootDiagram
          view={footView}
          selected={selected}
          observations={observations}
          onSelect={setSelected}
        />
        <Legend />
      </section>

      <AssessmentFeed observations={observations} onRemove={(id) => setObservations((p) => p.filter((o) => o.id !== id))} />

      <ProgressTimeline visits={INITIAL_TIMELINE} onOpen={setOpenVisit} />

      {/* FAB */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full shadow-lg grid place-items-center text-white"
        style={{ background: "var(--gradient-clin)" }}
        aria-label="Open AI assistant"
      >
        <Sparkles size={22} />
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--clin-purple)", opacity: 0.25 }} />
      </button>

      {/* Observation sheet */}
      <AnimatePresence>
        {selected && (
          <ObservationSheet
            key={`${selected.side}-${selected.zone}`}
            side={selected.side}
            zone={selected.zone}
            context={conditionContext}
            onClose={() => setSelected(null)}
            onSave={(text, source) => {
              addObservation({
                side: selected.side,
                zone: selected.zone,
                category: ZONE_TO_CATEGORY[selected.zone],
                text, source,
              });
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openAlert && (
          <AlertModal alert={openAlert} onClose={() => setOpenAlert(null)} onDismiss={dismissAlert} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openVisit && (
          <VisitDetailSheet visit={openVisit} onClose={() => setOpenVisit(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiOpen && <AiAssistantSheet onClose={() => setAiOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Header + summary
// ============================================================================

function BrandHeader() {
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="h-9 w-9 shrink-0 rounded-xl grid place-items-center text-white"
          style={{ background: "var(--gradient-clin)" }}
        >
          <Stethoscope size={18} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">ClinSole AI</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Good morning, Nurse Alina</p>
        </div>
      </div>
      <button
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-white shadow-sm"
        style={{ background: "var(--clin-purple)" }}
      >
        <Plus size={14} /> Patient
      </button>
    </header>
  );
}

function ClinicalSummary() {
  return (
    <section
      className="rounded-2xl p-4 text-white shadow-md"
      style={{ background: "var(--gradient-clin)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">Today's patient</p>
          <h2 className="text-xl font-semibold leading-tight mt-0.5 truncate">Harold Whitaker</h2>
          <p className="text-xs opacity-80">81 · Male · Home visit · 09:30</p>
        </div>
        <div className="text-right shrink-0">
          <RiskChip level="followup" />
          <p className="text-[10px] mt-1 opacity-80">Risk level</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <SummaryCell icon={<Heart size={13} />} label="Primary Dx" value="T2DM + PVD" />
        <SummaryCell icon={<Activity size={13} />} label="Last visit" value="3 wks ago" />
        <SummaryCell icon={<Bell size={13} />} label="Follow-up" value="In 14 days" />
        <SummaryCell icon={<ClipboardList size={13} />} label="Open tasks" value="4" />
      </div>
    </section>
  );
}

function SummaryCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur-sm px-2.5 py-2 min-w-0">
      <div className="flex items-center gap-1 opacity-80 text-[10px] uppercase tracking-wider">
        {icon} <span className="truncate">{label}</span>
      </div>
      <p className="mt-0.5 font-semibold truncate">{value}</p>
    </div>
  );
}

function RiskChip({ level }: { level: RiskLevel }) {
  const meta = RISK_META[level];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ============================================================================
// Smart alerts
// ============================================================================

function SmartAlerts({ alerts, onOpen }: { alerts: Alert[]; onOpen: (a: Alert) => void }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles size={14} style={{ color: "var(--clin-purple)" }} />
          Smart clinical alerts
        </h2>
        <span className="text-[11px] text-muted-foreground">{alerts.length} active</span>
      </div>
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {alerts.map((a) => {
          const meta = SEVERITY_META[a.severity];
          return (
            <button
              key={a.id}
              onClick={() => onOpen(a)}
              className="snap-start shrink-0 w-[72%] max-w-[280px] text-left rounded-2xl border bg-card shadow-sm p-3 transition hover:shadow-md"
              style={{ borderColor: `${meta.color}30` }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="h-6 w-6 rounded-full grid place-items-center shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon}
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider font-bold"
                  style={{ color: meta.color }}
                >
                  {a.severity}
                </span>
              </div>
              <p className="text-sm font-semibold leading-tight">{a.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{a.detail}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AlertModal({ alert, onClose, onDismiss }: { alert: Alert; onClose: () => void; onDismiss: (id: string) => void }) {
  const meta = SEVERITY_META[alert.severity];
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-card shadow-xl p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full grid place-items-center" style={{ background: meta.bg, color: meta.color }}>
              {meta.icon}
            </span>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: meta.color }}>{alert.severity}</p>
              <h3 className="font-semibold">{alert.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X size={18} /></button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{alert.detail}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onDismiss(alert.id)}
            className="flex-1 rounded-xl border border-[color:var(--border)] py-2 text-sm font-medium"
          >
            Dismiss
          </button>
          <button
            className="flex-1 rounded-xl py-2 text-sm font-medium text-white"
            style={{ background: "var(--clin-purple)" }}
          >
            Take action
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Foot diagram
// ============================================================================

function ViewToggle({ value, onChange }: { value: FootView; onChange: (v: FootView) => void }) {
  return (
    <div className="inline-flex rounded-full bg-[var(--surface-muted)] p-0.5 text-[11px] font-medium">
      {(["plantar", "dorsal"] as FootView[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-full transition ${value === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          {v === "plantar" ? "Plantar" : "Dorsal"}
        </button>
      ))}
    </div>
  );
}

function FootDiagram({
  view, selected, observations, onSelect,
}: {
  view: FootView;
  selected: { side: FootSide; zone: Zone } | null;
  observations: Observation[];
  onSelect: (v: { side: FootSide; zone: Zone }) => void;
}) {
  const zonesWithNotes = useMemo(() => {
    const set = new Set<string>();
    observations.forEach((o) => set.add(`${o.side}-${o.zone}`));
    return set;
  }, [observations]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <FootSvg side="left"  view={view} selected={selected} zonesWithNotes={zonesWithNotes} onSelect={onSelect} />
      <FootSvg side="right" view={view} selected={selected} zonesWithNotes={zonesWithNotes} onSelect={onSelect} />
    </div>
  );
}

function FootSvg({
  side, view, selected, zonesWithNotes, onSelect,
}: {
  side: FootSide; view: FootView;
  selected: { side: FootSide; zone: Zone } | null;
  zonesWithNotes: Set<string>;
  onSelect: (v: { side: FootSide; zone: Zone }) => void;
}) {
  const flip = side === "right";
  const isSelected = (z: Zone) => selected?.side === side && selected?.zone === z;
  const hasNote = (z: Zone) => zonesWithNotes.has(`${side}-${z}`);

  // Base zones shared by both views
  const baseZones: { z: Zone; d: string }[] = view === "plantar" ? [
    // Plantar view: heel, arch, forefoot, toes (individual + hallux), medial, lateral
    { z: "heel",     d: "M50 235 Q30 235 32 200 Q35 175 55 175 Q75 175 78 200 Q80 235 60 235 Z" },
    { z: "arch",     d: "M35 170 Q30 130 45 105 L75 105 Q80 130 78 170 Z" },
    { z: "forefoot", d: "M40 100 Q35 70 50 55 L82 55 Q88 75 82 100 Z" },
    { z: "hallux",   d: "M78 55 Q85 30 72 22 Q60 22 60 40 Q60 50 66 55 Z" },
    { z: "toes",     d: "M42 55 Q38 30 46 22 Q52 22 52 40 L52 55 Z M52 55 L52 32 Q56 26 60 26 L60 55 Z" },
    { z: "medial",   d: "M78 100 Q90 130 85 175 L78 175 Q80 130 78 100 Z" },
    { z: "lateral",  d: "M35 100 Q25 130 32 175 L38 175 Q30 130 35 100 Z" },
  ] : [
    // Dorsal view: dorsal surface, ankle, toes, hallux
    { z: "dorsal",   d: "M35 170 Q30 100 50 55 L82 55 Q90 100 78 170 Z" },
    { z: "ankle",    d: "M32 200 Q28 175 45 170 L75 170 Q82 175 78 200 Q80 235 60 235 Q40 235 32 200 Z" },
    { z: "hallux",   d: "M78 55 Q85 30 72 22 Q60 22 60 40 Q60 50 66 55 Z" },
    { z: "toes",     d: "M42 55 Q38 30 46 22 Q52 22 52 40 L52 55 Z M52 55 L52 32 Q56 26 60 26 L60 55 Z" },
    { z: "forefoot", d: "M40 100 Q35 70 50 55 L82 55 Q88 75 82 100 Z" },
    { z: "medial",   d: "M78 100 Q90 130 85 175 L78 175 Q80 130 78 100 Z" },
    { z: "lateral",  d: "M35 100 Q25 130 32 175 L38 175 Q30 130 35 100 Z" },
  ];

  return (
    <div className="relative">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center mb-1">
        {side === "left" ? "Left foot" : "Right foot"}
      </p>
      <svg
        viewBox="0 0 120 260"
        className="w-full h-auto"
        style={{ transform: flip ? "scaleX(-1)" : undefined }}
      >
        {/* Foot outline */}
        <path
          d="M50 240 Q25 240 28 195 Q22 130 40 80 Q35 40 55 20 Q75 15 82 45 Q90 80 88 130 Q92 195 82 240 Q65 245 50 240 Z"
          fill="#F1F5F9"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
        {baseZones.map(({ z, d }) => {
          const sel = isSelected(z);
          const note = hasNote(z);
          return (
            <path
              key={z}
              d={d}
              fill={sel ? "var(--clin-purple)" : note ? "var(--clin-blue-soft)" : "transparent"}
              fillOpacity={sel ? 0.9 : note ? 1 : 0}
              stroke={sel ? "var(--clin-purple)" : note ? "var(--clin-blue)" : "#94A3B8"}
              strokeWidth={sel ? 2 : 0.6}
              strokeDasharray={sel || note ? undefined : "2 2"}
              className="cursor-pointer transition-all"
              onClick={() => onSelect({ side, zone: z })}
              style={{ pointerEvents: "all" }}
            />
          );
        })}
        {/* Note markers */}
        {baseZones.map(({ z, d }) => {
          if (!hasNote(z) || isSelected(z)) return null;
          // Extract approx centroid from path (fallback fixed points)
          const centroids: Partial<Record<Zone, [number, number]>> = {
            heel: [55, 205], arch: [55, 140], forefoot: [60, 78], toes: [50, 40],
            hallux: [70, 40], plantar: [55, 140], dorsal: [55, 115], medial: [82, 140],
            lateral: [33, 140], ankle: [55, 200],
          };
          const c = centroids[z];
          if (!c) return null;
          return (
            <circle
              key={`m-${z}`}
              cx={c[0]} cy={c[1]} r="4"
              fill="var(--clin-blue)"
              stroke="white"
              strokeWidth="1.5"
              pointerEvents="none"
              style={{ transform: flip ? "scaleX(-1)" : undefined, transformOrigin: "60px 130px" }}
            />
          );
        })}
      </svg>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--clin-purple)" }} />
        Selected
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--clin-blue)" }} />
        Documented
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full border border-slate-400" />
        Tap to assess
      </span>
    </div>
  );
}

// ============================================================================
// Observation bottom sheet
// ============================================================================

function ObservationSheet({
  side, zone, context, onClose, onSave,
}: {
  side: FootSide;
  zone: Zone;
  context: ConditionContext;
  onClose: () => void;
  onSave: (text: string, source: Observation["source"]) => void;
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [source, setSource] = useState<Observation["source"]>("text");

  const chips = [...CHIP_SETS[context], ...CHIP_SETS.general];

  const addChip = (c: string) => {
    setText((t) => (t ? `${t} ${c}.` : `${c}.`).trim());
    setSource("chip");
  };

  const toggleMic = () => {
    if (recording) {
      setRecording(false);
      setText((t) => `${t}${t ? " " : ""}Skin dry with fissures noted on affected zone.`);
      setSource("voice");
      return;
    }
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setText((t) => `${t}${t ? " " : ""}Skin dry with fissures noted on affected zone.`);
      setSource("voice");
    }, 2400);
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--clin-purple)" }}>Location</p>
            <h3 className="text-lg font-semibold leading-tight">
              {side === "left" ? "Left" : "Right"} {ZONE_LABEL[zone]}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Auto-tagged · {ZONE_TO_CATEGORY[zone]} · {CONDITION_LABEL[context]}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Mic */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`h-12 w-12 rounded-full grid place-items-center shrink-0 shadow-sm text-white transition ${recording ? "animate-pulse" : ""}`}
            style={{ background: recording ? "var(--clin-red)" : "var(--clin-purple)" }}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            <Mic size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{recording ? "Listening…" : "Tap to dictate"}</p>
            <p className="text-[11px] text-muted-foreground">
              {recording ? "Speak your observation" : "Or type below, or tap a suggestion chip"}
            </p>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setSource("text"); }}
          rows={3}
          placeholder={`Observation for ${ZONE_LABEL[zone].toLowerCase()}…`}
          className="mt-3 w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--clin-purple)]"
        />

        {/* Chips */}
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => addChip(c)}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium hover:bg-[var(--surface-muted)] transition"
                style={{ borderColor: "var(--clin-blue-soft)", color: "var(--clin-blue)" }}
              >
                <Plus size={11} /> {c}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[color:var(--border)] py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            disabled={!text.trim()}
            onClick={() => onSave(text.trim(), source)}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--clin-purple)" }}
          >
            Save to assessment
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Assessment feed
// ============================================================================

function AssessmentFeed({ observations, onRemove }: { observations: Observation[]; onRemove: (id: string) => void }) {
  const grouped = useMemo(() => {
    const g = new Map<Category, Observation[]>();
    observations.forEach((o) => {
      const arr = g.get(o.category) ?? [];
      arr.push(o);
      g.set(o.category, arr);
    });
    return Array.from(g.entries());
  }, [observations]);

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className="text-sm font-semibold">Today's assessment</h2>
        <span className="text-[11px] text-muted-foreground">{observations.length} entries</span>
      </div>
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-6 text-center">
          <Footprints size={22} className="mx-auto text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground mt-2">
            Tap a zone on the foot diagram to start documenting.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-[color:var(--border)] shadow-sm divide-y divide-[color:var(--border)]">
          {grouped.map(([cat, obs]) => (
            <div key={cat} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "var(--clin-teal-soft)", color: "var(--clin-teal)" }}
                >
                  {cat}
                </span>
                <span className="text-[10px] text-muted-foreground">{obs.length}</span>
              </div>
              <ul className="space-y-2">
                {obs.map((o) => (
                  <li key={o.id} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">
                        {o.side === "left" ? "L" : "R"} {ZONE_LABEL[o.zone]} · {sourceLabel(o.source)} · {relTime(o.createdAt)}
                      </p>
                      <p className="text-sm leading-snug">{o.text}</p>
                    </div>
                    <button
                      onClick={() => onRemove(o.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive p-1"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function sourceLabel(s: Observation["source"]) {
  return s === "voice" ? "voice" : s === "chip" ? "chip" : "typed";
}

function relTime(t: number) {
  const diff = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}

// ============================================================================
// Progress timeline
// ============================================================================

function ProgressTimeline({ visits, onOpen }: { visits: Visit[]; onOpen: (v: Visit) => void }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className="text-sm font-semibold">Progress timeline</h2>
        <span className="text-[11px] text-muted-foreground">Swipe →</span>
      </div>
      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x pb-2 scrollbar-none">
        {visits.map((v) => {
          const meta = RISK_META[v.risk];
          return (
            <button
              key={v.id}
              onClick={() => onOpen(v)}
              className="snap-start shrink-0 w-[78%] max-w-[300px] text-left rounded-2xl bg-card border border-[color:var(--border)] shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{v.date}</span>
                <RiskChip level={v.risk} />
              </div>
              <p className="mt-2 font-semibold text-sm leading-tight">{v.treatment}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{v.provider}</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "70%", background: meta.color }} />
              </div>
              <div className="mt-3 flex items-start gap-1.5">
                <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: "var(--clin-purple)" }} />
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{v.summary}</p>
              </div>
              <div className="mt-2 flex items-center justify-end text-[11px] text-primary font-medium">
                Open <ChevronRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function VisitDetailSheet({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const [tab, setTab] = useState<"soap" | "photos" | "treatment" | "assessment" | "billing" | "followup">("soap");
  const tabs = [
    { id: "soap", label: "SOAP" },
    { id: "photos", label: "Photos" },
    { id: "treatment", label: "Treatment" },
    { id: "assessment", label: "Assessment" },
    { id: "billing", label: "Billing" },
    { id: "followup", label: "Follow-up" },
  ] as const;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{visit.date}</p>
            <h3 className="text-lg font-semibold leading-tight">{visit.treatment}</h3>
            <p className="text-[11px] text-muted-foreground">{visit.provider}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="mt-3 -mx-1 flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition ${
                tab === t.id ? "text-white" : "text-muted-foreground bg-[var(--surface-muted)]"
              }`}
              style={tab === t.id ? { background: "var(--clin-purple)" } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm leading-relaxed">
          {tab === "soap" && (
            <div className="space-y-3">
              {(["s", "o", "a", "p"] as const).map((k) => (
                <div key={k} className="rounded-xl bg-[var(--surface-muted)] p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--clin-purple)" }}>
                    {k === "s" ? "Subjective" : k === "o" ? "Objective" : k === "a" ? "Assessment" : "Plan"}
                  </p>
                  <p className="mt-1 text-sm">{visit.soap[k]}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "photos" && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: visit.photos }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-muted-foreground text-xs">
                  Photo {i + 1}
                </div>
              ))}
            </div>
          )}
          {tab === "treatment" && <p>{visit.treatment}. Debridement performed, emollient applied bilaterally.</p>}
          {tab === "assessment" && <p>{visit.summary}</p>}
          {tab === "billing" && <p className="font-medium">{visit.billing}</p>}
          {tab === "followup" && <p>{visit.followUp}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// AI assistant FAB sheet
// ============================================================================

function AiAssistantSheet({ onClose }: { onClose: () => void }) {
  const actions = [
    { icon: <FileText size={18} />, label: "Generate SOAP note",         hint: "From today's observations" },
    { icon: <ClipboardList size={18} />, label: "Summarize visit",       hint: "One-paragraph brief" },
    { icon: <GraduationCap size={18} />, label: "Patient education",     hint: "Print handout for Harold" },
    { icon: <Bell size={18} />, label: "Follow-up instructions",         hint: "SMS-ready reminder" },
    { icon: <Send size={18} />, label: "Referral letter",                hint: "To primary physician" },
    { icon: <MessageSquare size={18} />, label: "Ask a clinical question", hint: "Free-form Q&A" },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl grid place-items-center text-white" style={{ background: "var(--gradient-clin)" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-semibold">AI clinical assistant</h3>
              <p className="text-[11px] text-muted-foreground">Powered by your assessment context</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-card p-3 text-left hover:bg-[var(--surface-muted)] transition"
            >
              <span className="h-9 w-9 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--clin-purple-soft)", color: "var(--clin-purple)" }}>
                {a.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{a.hint}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
