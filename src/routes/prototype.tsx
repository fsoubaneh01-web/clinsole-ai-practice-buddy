import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity, Plus, Square, FileText, UserPlus, CalendarPlus, Sparkles,
  Search, Home, Users, Stethoscope, Calendar, Wallet, ChevronRight,
  Camera, X, CheckCircle2, Mic, Edit3, Moon, Sun, Timer,
} from "lucide-react";

export const Route = createFileRoute("/prototype")({
  head: () => ({
    meta: [
      { title: "ClinSole AI — Foot Care Nurse Assistant" },
      { name: "description", content: "AI-first rapid charting and practice management for independent foot care nurses." },
    ],
  }),
  component: Prototype,
});

type Tab = "dashboard" | "patients" | "soap" | "schedule" | "business";
type ScreenProps = { dark: boolean; onToggleTheme: () => void };

function Prototype() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  const screens: Record<Tab, React.ReactNode> = {
    dashboard: <Dashboard dark={dark} onToggleTheme={() => setDark((v) => !v)} />,
    patients: <Patients dark={dark} onToggleTheme={() => setDark((v) => !v)} />,
    soap: <SoapWorkspace dark={dark} onToggleTheme={() => setDark((v) => !v)} />,
    schedule: <Placeholder title="Schedule" subtitle="Upcoming visits and route planning" />,
    business: <Placeholder title="Business" subtitle="Revenue, expenses and monthly reports" />,
  };

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] text-foreground pb-24 overflow-x-hidden">
      <div className="mx-auto max-w-md relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.7 }}
          >
            {screens[tab]}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle night shift"
      className="shrink-0 h-9 w-9 grid place-items-center rounded-full bg-card border border-[color:var(--border)] shadow-sm hover:shadow-md transition-shadow text-muted-foreground hover:text-foreground"
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -60, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="grid place-items-center"
      >
        {dark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.span>
    </button>
  );
}

function InsightsRow() {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-0.5">
      <InsightBadge icon={<Timer size={12} />} label="42m Charting Saved" tone="teal" />
      <InsightBadge icon={<CheckCircle2 size={12} />} label="3/3 Notes Synced" tone="eucalyptus" />
      <InsightBadge icon={<Sparkles size={12} />} label="6 Visits Today" tone="amber" />
    </div>
  );
}

function InsightBadge({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "teal" | "eucalyptus" | "amber" }) {
  const tones = {
    teal: "bg-[#E0F2FE] text-[#0369A1]",
    eucalyptus: "bg-[#DBEAFE] text-[#0F172A]",
    amber: "bg-[#FBEBD9] text-[#DE8A44]",
  }[tone];

  return (
    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${tones}`}>
      {icon} {label}
    </span>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ dark, onToggleTheme }: ScreenProps) {
  return (
    <div className="px-4 pt-6 space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
            <Stethoscope size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">ClinSole AI</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Good morning, Nurse Alina</p>
          </div>
        </div>
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <button className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-medium shadow-sm hover:shadow-md transition-shadow">
          <Plus size={14} /> Patient
        </button>
      </header>

      <InsightsRow />


      {/* Active session */}
      <div className="rounded-2xl bg-gradient-to-br from-[oklch(0.98_0.02_195)] to-white border border-[color:var(--border)] shadow-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full gradient-primary grid place-items-center text-primary-foreground">
                <Mic size={18} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive ring-2 ring-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Active session</p>
              <p className="font-semibold truncate">Harold Whitaker</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground">04:12</span>
        </div>
        <Waveform />
        <button className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground py-2.5 text-sm font-medium hover:opacity-90 transition">
          <Square size={14} fill="currentColor" /> Stop & Draft SOAP
        </button>
      </div>

      {/* Drafts */}
      <section>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-sm font-semibold">AI Drafts Pending Review</h2>
          <span className="text-xs text-muted-foreground">3 pending</span>
        </div>
        <div className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x pb-2 scrollbar-none">
          {DRAFTS.map((d) => (
            <article key={d.name} className="snap-start shrink-0 w-[78%] rounded-2xl bg-card border border-[color:var(--border)] shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.age} yrs</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium bg-accent text-accent-foreground rounded-full px-2 py-0.5">{d.date}</span>
              </div>
              <p className="mt-2.5 text-sm text-muted-foreground leading-snug line-clamp-3">
                <span className="text-foreground font-medium">Drafted:</span> {d.snippet}
              </p>
              <button className="mt-3 w-full rounded-lg bg-primary text-primary-foreground py-2 text-xs font-medium hover:opacity-90 transition">
                Review & Sign
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold mb-2 px-0.5">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction icon={<FileText size={18} />} label="New SOAP Note" tint="teal" />
          <QuickAction icon={<UserPlus size={18} />} label="Add Patient" tint="oatmeal" />
          <QuickAction icon={<CalendarPlus size={18} />} label="Book Visit" tint="amber" />
          <QuickAction icon={<Sparkles size={18} />} label="AI Assistant" tint="eucalyptus" />

        </div>
      </section>

      <section className="rounded-2xl bg-card border border-[color:var(--border)] p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-lg font-semibold">6 visits · $540 expected</p>
          </div>
          <Activity className="text-primary" size={22} />
        </div>
      </section>
    </div>
  );
}

function Waveform() {
  const bars = [8, 14, 22, 16, 28, 20, 34, 24, 30, 18, 26, 14, 22, 10, 18, 26, 32, 20, 14, 22, 28, 16, 10];
  return (
    <div className="mt-3 flex items-center gap-[3px] h-10">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary/70"
          style={{
            height: `${h}px`,
            animation: `wave 1.2s ease-in-out ${i * 60}ms infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes wave { from { transform: scaleY(0.5);} to { transform: scaleY(1.15);} }`}</style>
    </div>
  );
}

function QuickAction({ icon, label, tint }: { icon: React.ReactNode; label: string; tint: "teal" | "eucalyptus" | "amber" | "oatmeal" }) {
  const tints = {
    teal: "bg-[color:var(--accent)] text-primary",
    eucalyptus: "bg-[#E6F2EC] text-[#2E7D32]",
    amber: "bg-[#FBEBD9] text-[#DE8A44]",
    oatmeal: "bg-[#F5F1E8] text-[oklch(0.35_0.03_60)]",
  }[tint];
  return (
    <button className="rounded-2xl bg-card border border-[color:var(--border)] p-3.5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${tints}`}>{icon}</div>
      <p className="mt-2.5 text-sm font-medium leading-tight">{label}</p>
    </button>
  );
}

const DRAFTS = [
  { name: "Margaret Chen", age: 74, date: "Today", snippet: "Routine footcare & diabetic check. Clear nail margins, no active ulcers." },
  { name: "Priya Ramesh", age: 68, date: "Today", snippet: "Callus debridement bilateral. Skin intact, urea cream reapplied." },
  { name: "Frank O'Neill", age: 79, date: "Yesterday", snippet: "Ingrown nail assessment. Mild erythema, no purulent discharge." },
];

/* ---------------- Patients ---------------- */
function Patients({ dark, onToggleTheme }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const patient = PATIENTS.find((p) => p.name === selected);

  return (
    <div className="px-4 pt-6 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <button className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium shadow-sm hover:shadow-md transition-shadow">
            <Plus size={14} /> New
          </button>
        </div>
      </header>


      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search patients by name"
          className="w-full rounded-xl bg-card border border-[color:var(--border)] pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <ul className="space-y-2.5">
        {PATIENTS.map((p) => (
          <li key={p.name}>
            <button
              onClick={() => setSelected(p.name)}
              className="w-full text-left rounded-2xl bg-card border border-[color:var(--border)] p-3.5 shadow-sm hover:shadow-md flex items-center gap-3 hover:border-primary/40 transition"
            >
              <div className="h-11 w-11 shrink-0 rounded-full gradient-primary grid place-items-center text-primary-foreground font-semibold">
                {p.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{p.name}</p>
                  <span className="text-xs text-muted-foreground">{p.age} yrs</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.cond}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => {
                    const risk = /risk|pvd/i.test(t);
                    return (
                      <span
                        key={t}
                        className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                          risk ? "bg-[#FBEBD9] text-[#DE8A44]" : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </button>
          </li>
        ))}
      </ul>

      {patient && <PatientDrawer patient={patient} onClose={() => setSelected(null)} />}
    </div>
  );
}

const PATIENTS = [
  { name: "Margaret Chen", age: 74, cond: "Neuropathy — annual review due", tags: ["Neuropathy", "Diabetic"] },
  { name: "Harold Whitaker", age: 81, cond: "Peripheral Vascular Disease", tags: ["PVD", "High risk"] },
  { name: "Priya Ramesh", age: 68, cond: "Rheumatoid Arthritis", tags: ["RA", "Diabetic"] },
];

function PatientDrawer({ patient, onClose }: { patient: (typeof PATIENTS)[number]; onClose: () => void }) {
  const [hotspot, setHotspot] = useState<null | { title: string; note: string }>(null);
  return (
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 pt-4 pb-3 border-b border-[color:var(--border)] flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Patient profile</p>
            <h2 className="font-semibold truncate">{patient.name} · {patient.age}</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full bg-muted"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-2xl bg-card border border-[color:var(--border)] p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Foot map</h3>
              <span className="text-[11px] text-muted-foreground">Tap hotspots</span>
            </div>
            <FootMap onHotspot={setHotspot} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Progress gallery</h3>
            <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shrink-0 w-32 rounded-xl overflow-hidden bg-card border border-[color:var(--border)] shadow-card">
                  <div className="h-24 bg-gradient-to-br from-[oklch(0.9_0.04_195)] to-[oklch(0.85_0.05_210)] grid place-items-center">
                    <Camera className="text-primary/60" size={22} />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-medium">Week {i}</p>
                    <p className="text-[10px] text-muted-foreground">Heel · dorsal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {hotspot && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md grid place-items-center p-6" onClick={() => setHotspot(null)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{hotspot.title}</h4>
                <button onClick={() => setHotspot(null)} className="h-7 w-7 grid place-items-center rounded-full bg-muted"><X size={14} /></button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{hotspot.note}</p>
              <button className="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium">Open full history</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FootMap({ onHotspot }: { onHotspot: (h: { title: string; note: string }) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["Left", "Right"].map((side) => (
        <div key={side} className="rounded-xl bg-[oklch(0.97_0.015_195)] border border-[color:var(--border)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{side} · plantar</p>
          <svg viewBox="0 0 100 180" className="w-full h-44">
            <defs>
              <linearGradient id={`f-${side}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.92 0.03 30)" />
                <stop offset="100%" stopColor="oklch(0.86 0.04 25)" />
              </linearGradient>
            </defs>
            {/* Foot outline */}
            <path
              d="M50 8 C 72 8 82 30 80 60 C 78 90 88 118 82 145 C 78 168 60 176 50 176 C 40 176 22 168 18 145 C 12 118 22 90 20 60 C 18 30 28 8 50 8 Z"
              fill={`url(#f-${side})`}
              stroke="oklch(0.72 0.06 25)"
              strokeWidth="1.2"
            />
            {/* Toes */}
            {[
              { cx: 50, r: 8 }, { cx: 32, r: 5.5 }, { cx: 68, r: 5.5 },
              { cx: 22, r: 4.5 }, { cx: 78, r: 4.5 },
            ].map((t, i) => (
              <circle key={i} cx={t.cx} cy={i === 0 ? 10 : 14 + Math.abs(t.cx - 50) * 0.15} r={t.r} fill={`url(#f-${side})`} stroke="oklch(0.72 0.06 25)" strokeWidth="1" />
            ))}
            {/* Hotspots */}
            <Hotspot cx={50} cy={20} onClick={() => onHotspot({ title: `${side} great toe`, note: "Nail elongated, minimal subungual debris. Trimmed and cleared today. No erythema." })} />
            <Hotspot cx={50} cy={155} onClick={() => onHotspot({ title: `${side} heel fissure`, note: "Mild erythema, skin intact but dry. Applying urea cream 20% twice daily." })} />
            {side === "Right" && <Hotspot cx={70} cy={100} onClick={() => onHotspot({ title: "Lateral callus", note: "2mm hyperkeratosis over 5th MTP. Debrided; monitor at next visit." })} />}
          </svg>
        </div>
      ))}
    </div>
  );
}

function Hotspot({ cx, cy, onClick }: { cx: number; cy: number; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <circle cx={cx} cy={cy} r="8" fill="oklch(0.6 0.19 25 / 0.15)">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="4" fill="oklch(0.6 0.19 25)" stroke="white" strokeWidth="1.5" />
    </g>
  );
}

/* ---------------- SOAP Workspace ---------------- */
function SoapWorkspace({ dark, onToggleTheme }: ScreenProps) {
  return (
    <div className="pt-6 pb-32">
      <div className="px-4 flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">AI SOAP Workspace</p>
          <h1 className="text-xl font-semibold tracking-tight truncate">Harold Whitaker · Visit 12</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <span className="text-[10px] font-medium bg-accent text-accent-foreground rounded-full px-2 py-1">Draft</span>
        </div>
      </div>


      {/* Transcription */}
      <div className="px-4">
        <div className="rounded-2xl bg-[oklch(0.96_0.008_210)] border border-[color:var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={14} className="text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambient Transcription Summary</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-foreground/80 leading-relaxed">
            <li>• Left great toe nail trimmed and cleared.</li>
            <li>• Minimal subungual debris removed.</li>
            <li>• Monofilament test indicates reduced sensation on plantar surface bilaterally.</li>
            <li>• Patient reports mild tingling but no sharp pain.</li>
          </ul>
        </div>
      </div>

      {/* Structured note */}
      <div className="px-4 mt-4 space-y-3">
        <SoapSection letter="S" title="Subjective" body={
          <p>
            Patient reports <Hl>mild tingling in both feet</Hl> but <Hl>no sharp pain</Hl>. Continues moisturizing routine.
          </p>
        } />
        <SoapSection letter="O" title="Objective" body={
          <p>
            Nails elongated but intact. Pre-treatment <Hl>monofilament test 6/10 response</Hl>. No active ulcerations or skin breakdown on heels.
          </p>
        } />
        <SoapSection letter="A" title="Assessment" body={
          <p>
            <Hl>Stable diabetic neuropathy</Hl> requiring routine preventative maintenance.
          </p>
        } />
        <SoapSection letter="P" title="Plan" body={
          <p>
            Scheduled for <Hl>routine nail and skin debridement in 6 weeks</Hl>. Recommend daily moisturizing cream and daily foot self-inspection.
          </p>
        } />
      </div>

      {/* Sticky bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30">
        <div className="mx-auto max-w-md px-4">
          <div className="rounded-2xl bg-background/95 backdrop-blur border border-[color:var(--border)] shadow-card p-3 flex items-center gap-2">
            <button className="h-11 w-11 rounded-xl bg-muted grid place-items-center"><Edit3 size={16} /></button>
            <button className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition">
              <CheckCircle2 size={18} /> Approve & Sync to EHR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoapSection({ letter, title, body }: { letter: string; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-[color:var(--border)] p-4 shadow-card">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="h-7 w-7 rounded-lg gradient-primary text-primary-foreground grid place-items-center text-xs font-bold">{letter}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm text-foreground/85 leading-relaxed">{body}</div>
    </div>
  );
}

function Hl({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(children));
  if (editing) {
    return (
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
        className="inline-block rounded-md bg-[oklch(0.93_0.04_195)] px-1 py-0.5 outline-none ring-2 ring-primary/40 min-w-[6ch]"
        style={{ width: `${Math.max(text.length, 6)}ch` }}
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded-md bg-[oklch(0.95_0.035_195)] hover:bg-[oklch(0.92_0.05_195)] px-1 py-0.5 transition text-primary/90 font-medium"
    >
      {text}
    </button>
  );
}

/* ---------------- Placeholder ---------------- */
function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-8 rounded-2xl bg-card border border-dashed border-[color:var(--border)] p-10 text-center">
        <p className="text-sm text-muted-foreground">Coming next in the prototype.</p>
      </div>
    </div>
  );
}

/* ---------------- Bottom nav ---------------- */
function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { id: "patients", label: "Patients", icon: <Users size={20} /> },
    { id: "soap", label: "AI SOAP", icon: <Stethoscope size={20} /> },
    { id: "schedule", label: "Schedule", icon: <Calendar size={20} /> },
    { id: "business", label: "Business", icon: <Wallet size={20} /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--border)] bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-md grid grid-cols-5 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="relative flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium"
            >
              <span className={`h-9 w-14 grid place-items-center rounded-full transition ${active ? "bg-primary/12 text-primary" : "text-muted-foreground"}`}>
                {it.icon}
              </span>
              <span className={active ? "text-primary" : "text-muted-foreground"}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
