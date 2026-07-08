import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity, Plus, Square, FileText, UserPlus, CalendarPlus, Sparkles,
  Search, Home, Users, Stethoscope, Calendar, Wallet, ChevronRight,
  Camera, X, CheckCircle2, Mic, Edit3, Moon, Sun, Timer, Bell, Pause, Play, User,
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
type ScreenProps = {
  dark: boolean;
  onToggleTheme: () => void;
  setTab: (t: Tab) => void;
  sessionOpen: boolean;
  onToggleSession: () => void;
};

function Prototype() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dark, setDark] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [snackVisible, setSnackVisible] = useState(true);
  const [notifCount, setNotifCount] = useState(2);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  const shared: ScreenProps = {
    dark,
    onToggleTheme: () => setDark((v) => !v),
    setTab,
    sessionOpen,
    onToggleSession: () => setSessionOpen((v) => !v),
  };

  const screens: Record<Tab, React.ReactNode> = {
    dashboard: <Dashboard {...shared} />,
    patients: <Patients {...shared} />,
    soap: <SoapWorkspace {...shared} />,
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

      {sessionOpen && tab !== "soap" && (
        <RecordingWidget
          micActive={micActive}
          onToggleMic={() => setMicActive((v) => !v)}
          onOpen={() => setTab("soap")}
          onClose={() => setSessionOpen(false)}
        />
      )}

      {snackVisible && notifCount > 0 && (
        <Snackbar
          count={notifCount}
          onOpen={() => { setTab("soap"); setNotifCount(0); setSnackVisible(false); }}
          onDismiss={() => setSnackVisible(false)}
        />
      )}

      <BottomNav tab={tab} setTab={setTab} notifCount={notifCount} />
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
function Dashboard({ dark, onToggleTheme, setTab, sessionOpen, onToggleSession }: ScreenProps) {
  return (
    <div className="px-4 pt-6 space-y-5">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
            <Stethoscope size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">ClinSole AI</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Good morning, Nurse Alina</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <button className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-medium shadow-sm hover:shadow-md transition-shadow">
            <Plus size={14} /> Patient
          </button>
        </div>
      </header>

      <SessionPill open={sessionOpen} onToggle={onToggleSession} />

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

      {/* Interactive foot map */}
      <section>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-sm font-semibold">Foot map · Harold Whitaker</h2>
          <span className="text-[11px] text-muted-foreground">3 active zones</span>
        </div>
        <div className="rounded-2xl bg-card border border-[color:var(--border)] shadow-sm p-4">
          <InteractiveFootMap />
        </div>
      </section>

      {/* Care timeline with day filter */}
      <TimelineWithCalendar />




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
    teal: "bg-[#E0F2FE] text-[#0369A1]",
    eucalyptus: "bg-[#DBEAFE] text-[#0F172A]",
    amber: "bg-[#FBEBD9] text-[#DE8A44]",
    oatmeal: "bg-[#F1F5F9] text-[#0F172A]",
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
            <InteractiveFootMap />
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
function BottomNav({ tab, setTab, notifCount }: { tab: Tab; setTab: (t: Tab) => void; notifCount: number }) {
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
          const showBadge = it.id === "dashboard" && notifCount > 0;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="relative flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium"
            >
              <span className={`relative h-9 w-14 grid place-items-center rounded-full transition ${active ? "bg-primary/12 text-primary" : "text-muted-foreground"}`}>
                {it.icon}
                {showBadge && (
                  <span className="absolute top-0.5 right-3 flex h-4 w-4">
                    <span className="absolute inset-0 rounded-full bg-[#0369A1] opacity-60 animate-ping" />
                    <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0369A1] text-[9px] font-bold text-white ring-2 ring-background">
                      {notifCount}
                    </span>
                  </span>
                )}
              </span>
              <span className={active ? "text-primary" : "text-muted-foreground"}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------- Session pill (header) ---------------- */
function SessionPill({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full inline-flex items-center justify-between gap-3 rounded-full bg-card border border-[color:var(--border)] shadow-sm hover:shadow-md transition px-3 py-2"
    >
      <span className="inline-flex items-center gap-2 min-w-0">
        <span className="relative shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center">
          <User size={14} />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
        </span>
        <span className="text-xs font-medium truncate">
          Active Session: <span className="text-primary">Harold Whitaker</span>
        </span>
      </span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {open ? "Hide" : "Show"}
      </span>
    </button>
  );
}

/* ---------------- Floating recording widget ---------------- */
function RecordingWidget({
  micActive, onToggleMic, onOpen, onClose,
}: { micActive: boolean; onToggleMic: () => void; onOpen: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<"ambient" | "direct">("ambient");
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="mx-auto max-w-md rounded-2xl bg-card border border-[color:var(--border)] shadow-card p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMic}
            aria-label={micActive ? "Pause recording" : "Resume recording"}
            className={`shrink-0 h-11 w-11 rounded-full grid place-items-center text-white transition ${micActive ? "bg-primary shadow-[0_0_0_6px_rgba(14,165,233,0.15)]" : "bg-muted text-muted-foreground"}`}
          >
            {micActive ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              AI SOAP Note Draft {mode === "ambient" ? "(In Progress)" : "(Push-to-talk)"}
            </p>
            <p className="text-xs font-semibold truncate">{micActive ? "Recording · Harold Whitaker" : "Paused · Harold Whitaker"}</p>
            <MiniWave active={micActive} mode={mode} />
          </button>
          <button onClick={onClose} aria-label="Close" className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1 rounded-full bg-muted p-0.5 text-[10px] font-semibold">
          {(["ambient", "direct"] as const).map((m) => (
            <button
              key={m}
              onClick={(e) => { e.stopPropagation(); setMode(m); }}
              className={`flex-1 rounded-full py-1 transition ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {m === "ambient" ? "Ambient Listening" : "Direct Dictation"}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MiniWave({ active, mode = "ambient" }: { active: boolean; mode?: "ambient" | "direct" }) {
  const ambientBars = [6, 10, 14, 8, 16, 11, 18, 9, 13, 7, 15, 10, 12];
  const directBars = [3, 20, 4, 22, 5, 18, 3, 24, 4, 19, 3, 21, 4];
  const bars = mode === "ambient" ? ambientBars : directBars;
  return (
    <div className="mt-1 flex items-center gap-[2px] h-5">
      {bars.map((h, i) => (
        <span
          key={`${mode}-${i}`}
          className={`rounded-full bg-primary/70 ${mode === "ambient" ? "w-[2px]" : "w-[3px]"}`}
          style={{
            height: `${h}px`,
            animation: active
              ? `wave ${mode === "ambient" ? "1s" : "0.35s"} ease-in-out ${i * (mode === "ambient" ? 55 : 25)}ms infinite alternate`
              : "none",
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}


/* ---------------- Snackbar toast ---------------- */
function Snackbar({ count, onOpen, onDismiss }: { count: number; onOpen: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.4 }}
      className="fixed bottom-40 left-4 z-50"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] text-white pl-3 pr-1 py-1 shadow-lg">
        <button onClick={onOpen} className="inline-flex items-center gap-2 text-xs font-medium py-1.5 pr-1">
          <Bell size={14} className="text-[#0EA5E9]" />
          <span>{count} new notes to sign</span>
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/10 text-white/70 hover:text-white"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}

/* ---------------- Interactive foot map (severity hotspots) ---------------- */
type SeverityHotspot = {
  id: string;
  side: "L" | "R";
  cx: number;
  cy: number;
  tone: "red" | "blue" | "amber";
  label: string;
  note: string;
};

const SEV_HOTSPOTS: SeverityHotspot[] = [
  { id: "l-1st-toe", side: "L", cx: 68, cy: 22, tone: "red", label: "Callus — 1st Toe", note: "Hyperkeratotic lesion 4mm, dorsal aspect. Debrided 06/28/26. Reassess in 2 weeks." },
  { id: "r-5th-toe", side: "R", cx: 78, cy: 30, tone: "blue", label: "Wound Care — 5th Toe", note: "Active superficial ulcer, granulating well. Dressing changed today. Continue silver foam Q48h." },
  { id: "r-heel", side: "R", cx: 50, cy: 150, tone: "amber", label: "Dry Skin — Heel", note: "Heel fissure, last noted 07/03/26. Click to dictate observation." },
];

const TONE_STYLE = {
  red: { fill: "#DC2626", glow: "rgba(220,38,38,0.35)" },
  blue: { fill: "#0EA5E9", glow: "rgba(14,165,233,0.35)" },
  amber: { fill: "#DE8A44", glow: "rgba(222,138,68,0.35)" },
} as const;

function InteractiveFootMap() {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = SEV_HOTSPOTS.find((h) => h.id === openId) || null;

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-3">
        {(["L", "R"] as const).map((side) => (
          <div key={side} className="rounded-xl bg-[#F8FAFC] border border-[color:var(--border)] p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{side === "L" ? "Left" : "Right"} · plantar</p>
              <p className="text-[10px] text-muted-foreground/80">Tap dot</p>
            </div>
            <svg viewBox="0 0 100 180" className="w-full h-44">
              <defs>
                <linearGradient id={`skin-${side}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDE8D7" />
                  <stop offset="100%" stopColor="#F5CDA8" />
                </linearGradient>
              </defs>
              <path
                d="M50 8 C 72 8 82 30 80 60 C 78 90 88 118 82 145 C 78 168 60 176 50 176 C 40 176 22 168 18 145 C 12 118 22 90 20 60 C 18 30 28 8 50 8 Z"
                fill={`url(#skin-${side})`}
                stroke="#E2B48A"
                strokeWidth="1.2"
              />
              {[
                { cx: 50, r: 8 }, { cx: 32, r: 5.5 }, { cx: 68, r: 5.5 },
                { cx: 22, r: 4.5 }, { cx: 78, r: 4.5 },
              ].map((t, i) => (
                <circle key={i} cx={t.cx} cy={i === 0 ? 10 : 14 + Math.abs(t.cx - 50) * 0.15} r={t.r} fill={`url(#skin-${side})`} stroke="#E2B48A" strokeWidth="1" />
              ))}
              {SEV_HOTSPOTS.filter((h) => h.side === side).map((h) => {
                const t = TONE_STYLE[h.tone];
                return (
                  <g key={h.id} onClick={(e) => { e.stopPropagation(); setOpenId(openId === h.id ? null : h.id); }} style={{ cursor: "pointer" }}>
                    <circle cx={h.cx} cy={h.cy} r="10" fill={t.glow}>
                      <animate attributeName="r" values="6;12;6" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.55;0.15;0.55" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={h.cx} cy={h.cy} r="4.5" fill={t.fill} stroke="white" strokeWidth="1.5" />
                  </g>
                );
              })}
            </svg>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SEV_HOTSPOTS.map((h) => {
          const t = TONE_STYLE[h.tone];
          return (
            <button
              key={h.id}
              onClick={() => setOpenId(openId === h.id ? null : h.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-card px-2 py-1 text-[10px] font-medium hover:shadow-sm transition"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full opacity-60 animate-ping" style={{ background: t.fill }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: t.fill }} />
              </span>
              {h.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="mt-3 rounded-xl border border-[color:var(--border)] bg-card p-3 shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: TONE_STYLE[active.tone].fill }} />
                  <p className="text-xs font-semibold truncate">{active.label}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{active.note}</p>
              </div>
              <button onClick={() => setOpenId(null)} className="shrink-0 h-6 w-6 grid place-items-center rounded-full bg-muted text-muted-foreground">
                <X size={12} />
              </button>
            </div>
            <button className="mt-2 w-full rounded-lg bg-primary text-primary-foreground py-1.5 text-[11px] font-semibold">
              Dictate observation
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Care timeline ---------------- */
type DayKey = "mon" | "tue" | "wed";
type TimelineItem = {
  title: string; patient: string; date: string; day: DayKey;
  progress: number; tone: "teal" | "amber" | "eucalyptus"; details: string;
};
const TIMELINE: TimelineItem[] = [
  { title: "Nail Care", patient: "Harold Whitaker", date: "Mon 6 · 09:15", day: "mon", progress: 100, tone: "eucalyptus",
    details: "Tools used: 15 blade, nippers. No signs of infection. Debridement complete." },
  { title: "Ulcer Dressing Change", patient: "Harold Whitaker", date: "Mon 6 · 09:35", day: "mon", progress: 70, tone: "teal",
    details: "Silver foam dressing applied. Wound bed 60% granulation, no odor. Next change Q48h." },
  { title: "Diabetic Foot Screen", patient: "Margaret Chen", date: "Tue 7 · 10:00", day: "tue", progress: 30, tone: "amber",
    details: "Monofilament 6/10 sites. Pedal pulses palpable bilaterally. Education reinforced." },
  { title: "Callus Debridement", patient: "Priya Ramesh", date: "Wed 8 · 11:00", day: "wed", progress: 10, tone: "teal",
    details: "Bilateral plantar callus, 3mm hyperkeratosis. Planned sharp debridement + urea 20%." },
];
const BAR_TONE = {
  teal: "bg-[#0EA5E9]",
  amber: "bg-[#DE8A44]",
  eucalyptus: "bg-[#059669]",
} as const;

const DAYS: { key: DayKey; label: string; num: string }[] = [
  { key: "mon", label: "Mon", num: "6" },
  { key: "tue", label: "Tue", num: "7" },
  { key: "wed", label: "Wed", num: "8" },
];

function MiniCalendar({ selected, onSelect }: { selected: DayKey; onSelect: (d: DayKey) => void }) {
  return (
    <div className="flex items-center gap-2">
      {DAYS.map((d) => {
        const active = d.key === selected;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2 text-[10px] font-semibold transition ${
              active
                ? "bg-[#0F172A] text-white shadow-md"
                : "border border-[color:var(--border)] text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="uppercase tracking-wider">{d.label}</span>
            <span className={`text-sm ${active ? "text-white" : "text-foreground"}`}>{d.num}</span>
          </button>
        );
      })}
    </div>
  );
}

function TimelineWithCalendar() {
  const [day, setDay] = useState<DayKey>("mon");
  const [expanded, setExpanded] = useState<string | null>(null);
  const items = TIMELINE.filter((t) => t.day === day);
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className="text-sm font-semibold">Patient Care Timeline</h2>
        <span className="text-[11px] text-muted-foreground">{items.length} events</span>
      </div>
      <div className="mb-3">
        <MiniCalendar selected={day} onSelect={(d) => { setDay(d); setExpanded(null); }} />
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const key = t.title + t.patient;
            const isOpen = expanded === key;
            return (
              <motion.li
                key={key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="rounded-2xl bg-card border border-[color:var(--border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{t.patient} · {t.title}</p>
                        <p className="text-[11px] text-muted-foreground">{t.date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground">{t.progress}%</span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          className="h-6 w-6 grid place-items-center rounded-full bg-muted text-muted-foreground"
                        >
                          <ChevronRight size={14} className="rotate-90" />
                        </motion.span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.progress}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 22 }}
                        className={`h-full rounded-full ${BAR_TONE[t.tone]}`}
                      />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                        className="overflow-hidden border-t border-[color:var(--border)] bg-[#F8FAFC]"
                      >
                        <div className="p-3 text-xs text-foreground/80 leading-relaxed">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Clinical detail</p>
                          {t.details}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}


