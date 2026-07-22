import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, isToday, isPast, addDays, differenceInMinutes } from "date-fns";
import {
  Calendar, Users, FileText, TrendingUp, ChevronRight, Bell, Sparkles,
  AlertTriangle, Activity,
} from "lucide-react";

import { AppShell, Container } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FootAssessmentModule, type FootObservation } from "@/components/FootAssessmentModule";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });



function Dashboard() {
  const { nurse, patients, appointments, transactions, footAssessments } = useStore();
  const now = new Date();
  const in7 = addDays(now, 7);

  const today = useMemo(
    () => appointments.filter((a) => isToday(new Date(a.date))).sort((a, b) => a.date.localeCompare(b.date)),
    [appointments],
  );
  const followUpsDue = useMemo(
    () => patients.filter((p) => p.nextFollowUp && new Date(p.nextFollowUp) <= in7),
    [patients, in7],
  );
  const notesToFinish = useMemo(
    () => today.filter((a) => new Date(a.date) < now).length,
    [today, now],
  );
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const revenue = transactions
    .filter((t) => t.type === "income" && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + t.amount, 0);

  const activePatient = today[0]?.patientName
    ? patients.find((p) => p.id === today[0].patientId) ?? patients[0]
    : patients[0];

  const [footView, setFootView] = useState<FootView>("plantar");
  const [selected, setSelected] = useState<{ side: FootSide; zone: ZoneId } | null>(null);
  const [observations, setObservations] = useState<{ id: string; side: FootSide; zone: ZoneId; text: string; at: string }[]>([]);
  const [draft, setDraft] = useState("");

  const alerts = useMemo(() => {
    const list: { id: string; kind: "risk" | "overdue" | "missing"; text: string; patientId?: string }[] = [];
    for (const p of patients) {
      if (p.nextFollowUp && isPast(new Date(p.nextFollowUp))) {
        list.push({ id: `f-${p.id}`, kind: "overdue", text: `${p.name} · follow-up overdue`, patientId: p.id });
      }
      if (p.diabetesStatus === "type1" || p.diabetesStatus === "type2") {
        const last = footAssessments.find((a) => a.patientId === p.id);
        if (!last) list.push({ id: `m-${p.id}`, kind: "missing", text: `${p.name} · needs foot assessment`, patientId: p.id });
        else if (last.riskLevel === "high") list.push({ id: `r-${p.id}`, kind: "risk", text: `${p.name} · high diabetic risk`, patientId: p.id });
      }
    }
    return list.slice(0, 8);
  }, [patients, footAssessments]);

  const timeline = useMemo(
    () => appointments
      .filter((a) => new Date(a.date) <= now)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6),
    [appointments, now],
  );

  const saveObservation = () => {
    if (!selected || !draft.trim()) return;
    setObservations((prev) => [
      { id: crypto.randomUUID(), side: selected.side, zone: selected.zone, text: draft.trim(), at: new Date().toISOString() },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <AppShell title="Dashboard">
      <Container className="py-6 lg:py-8">
        {/* Greeting header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {format(now, "EEEE · MMMM d, yyyy")}
            </div>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight lg:text-3xl">
              Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}
              {nurse?.name ? `, ${nurse.name.split(" ")[0]}!` : "!"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {today.length} visit{today.length === 1 ? "" : "s"} today · {followUpsDue.length} follow-up{followUpsDue.length === 1 ? "" : "s"} pending
            </p>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full gradient-primary text-sm font-bold text-primary-foreground shadow-soft lg:h-12 lg:w-12">
            {(nurse?.name || nurse?.email || "N").slice(0, 2).toUpperCase()}
          </div>
        </header>

        {/* Metric cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Metric icon={Calendar} label="Today's Visits" value={today.length} sub={`${today.reduce((s, a) => s + a.duration, 0)} min booked`} tint="purple" />
          <Metric icon={Users} label="Total Patients" value={patients.length} sub={`${followUpsDue.length} due follow-up`} tint="teal" />
          <Metric icon={FileText} label="Notes to Finish" value={notesToFinish} sub={notesToFinish ? "Awaiting sign-off" : "All caught up"} tint="amber" />
          <Metric icon={TrendingUp} label="Revenue (mo)" value={`$${revenue.toLocaleString()}`} sub={`${transactions.filter((t) => t.type === "income" && new Date(t.date) >= monthStart).length} paid`} tint="green" />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Foot assessment panel */}
          <section className="rounded-3xl border bg-surface p-5 shadow-card lg:col-span-2 lg:p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Active session</div>
                <h2 className="mt-0.5 truncate text-lg font-bold lg:text-xl">
                  Foot assessment · {activePatient?.name ?? "No patient"}
                </h2>
                {activePatient && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {activePatient.diabetesStatus !== "none" ? `${activePatient.diabetesStatus.toUpperCase()} · ` : ""}
                    Last visit {activePatient.assessments[0] ? format(new Date(activePatient.assessments[0].date), "MMM d") : "—"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 rounded-full bg-muted p-1 text-xs font-medium">
                {(["plantar", "dorsal"] as FootView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFootView(v)}
                    className={cn(
                      "rounded-full px-3 py-1.5 capitalize transition-colors",
                      footView === v ? "bg-surface text-primary shadow-soft" : "text-muted-foreground",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Feet */}
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[color:var(--clin-teal-soft)]/50 p-4">
              <FootDiagram side="L" view={footView} selected={selected} onSelect={(zone) => setSelected({ side: "L", zone })} />
              <FootDiagram side="R" view={footView} selected={selected} onSelect={(zone) => setSelected({ side: "R", zone })} />
            </div>

            {/* Observation panel */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="mt-4 rounded-2xl border bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {selected.side} · {ZONES.find((z) => z.id === selected.zone)?.label}
                      </span>
                      <span className="text-muted-foreground">Add observation</span>
                    </div>
                    <button onClick={() => setSelected(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setDraft((d) => (d ? `${d}. ${s}` : s))}
                        className="rounded-full border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/30 hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type or use chips above…"
                      rows={2}
                      className="min-h-[64px] flex-1 resize-none rounded-xl border bg-surface p-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                    <div className="flex flex-col gap-2">
                      <button className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground shadow-soft" aria-label="Dictate">
                        <Mic className="h-4 w-4" />
                      </button>
                      <button
                        onClick={saveObservation}
                        disabled={!draft.trim()}
                        className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft disabled:opacity-40"
                        aria-label="Save"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Observations feed */}
            {observations.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Session log</div>
                {observations.map((o) => (
                  <div key={o.id} className="flex gap-3 rounded-xl border bg-surface p-3 text-sm">
                    <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary">
                      {o.side} · {ZONES.find((z) => z.id === o.zone)?.label}
                    </span>
                    <p className="min-w-0 flex-1">{o.text}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{format(new Date(o.at), "HH:mm")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right column: alerts + AI assistant */}
          <aside className="space-y-5">
            <section className="rounded-3xl border bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Smart alerts</h2>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-warning px-1.5 text-[11px] font-bold text-warning-foreground">
                  {alerts.length}
                </span>
              </div>
              {alerts.length === 0 ? (
                <Empty text="No active alerts." />
              ) : (
                <ul className="mt-3 space-y-2">
                  {alerts.map((a) => {
                    const Icon = a.kind === "risk" ? AlertTriangle : a.kind === "overdue" ? Bell : Activity;
                    const tint = a.kind === "risk" ? "text-destructive bg-destructive/10" : a.kind === "overdue" ? "text-warning bg-warning/10" : "text-primary bg-primary/10";
                    return (
                      <li key={a.id}>
                        <Link
                          to={a.patientId ? "/app/patients/$id" : "/app/patients"}
                          params={a.patientId ? { id: a.patientId } : undefined}
                          className="flex items-center gap-3 rounded-2xl border bg-background p-3 text-sm hover:bg-muted"
                        >
                          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", tint)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{a.text}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-card">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
                  <Sparkles className="h-4 w-4" /> AI Assistant
                </div>
                <h3 className="mt-2 text-lg font-bold">Draft SOAP from today's session</h3>
                <p className="mt-1 text-sm opacity-90">
                  {observations.length} observation{observations.length === 1 ? "" : "s"} captured · ready to structure.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="secondary" className="bg-white/95 text-primary hover:bg-white">
                    <Link to="/app/soap"><FileText className="mr-1 h-4 w-4" />Generate</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                    <Link to="/app/assistant">Ask AI</Link>
                  </Button>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Timeline + Schedule */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          <section className="rounded-3xl border bg-surface p-5 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Patient care timeline</h2>
              <Link to="/app/patients" className="text-xs font-medium text-primary">View all</Link>
            </div>
            {timeline.length === 0 ? (
              <Empty text="No completed visits yet." />
            ) : (
              <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible">
                {timeline.map((v) => {
                  const patient = patients.find((p) => p.id === v.patientId);
                  const risk = patient?.assessments[0]?.risk ?? "low";
                  const riskColor = risk === "high" ? "bg-destructive" : risk === "medium" ? "bg-warning" : "bg-success";
                  return (
                    <Link
                      key={v.id}
                      to="/app/patients/$id"
                      params={{ id: v.patientId }}
                      className="min-w-[260px] snap-start rounded-2xl border bg-background p-4 shadow-soft transition-shadow hover:shadow-card lg:min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {format(new Date(v.date), "MMM d · HH:mm")}
                        </span>
                        <span className={cn("h-2 w-2 rounded-full", riskColor)} />
                      </div>
                      <div className="mt-2 truncate text-sm font-bold">{v.patientName}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{v.type}</div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full", riskColor)} style={{ width: risk === "high" ? "40%" : risk === "medium" ? "70%" : "95%" }} />
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {risk === "high" ? "Close monitoring" : risk === "medium" ? "Follow protocol" : "Stable"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-3xl border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's schedule</h2>
              <Link to="/app/calendar" className="text-xs font-medium text-primary">Open</Link>
            </div>
            {today.length === 0 ? (
              <Empty text="Nothing scheduled today." />
            ) : (
              <ul className="mt-3 space-y-2">
                {today.map((a) => {
                  const mins = differenceInMinutes(new Date(a.date), now);
                  const soon = mins > 0 && mins < 60;
                  return (
                    <li key={a.id}>
                      <Link
                        to="/app/patients/$id"
                        params={{ id: a.patientId }}
                        className="flex items-center gap-3 rounded-2xl border bg-background p-3 hover:bg-muted"
                      >
                        <div className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                          {format(new Date(a.date), "HH:mm")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{a.patientName}</div>
                          <div className="truncate text-xs text-muted-foreground">{a.type} · {a.duration} min</div>
                        </div>
                        {soon && <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">Soon</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* FAB - mobile */}
        <Link
          to="/app/assistant"
          className="fixed bottom-20 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-card lg:hidden"
          aria-label="AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
        </Link>
      </Container>
    </AppShell>
  );
}

function Metric({
  icon: Icon, label, value, sub, tint,
}: {
  icon: any; label: string; value: string | number; sub: string; tint: "purple" | "teal" | "amber" | "green";
}) {
  const tints: Record<string, string> = {
    purple: "bg-primary/10 text-primary",
    teal: "bg-secondary/10 text-secondary",
    amber: "bg-warning/15 text-warning",
    green: "bg-success/10 text-success",
  };
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-soft transition-shadow hover:shadow-card lg:p-5">
      <div className="flex items-start justify-between">
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", tints[tint])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold leading-none lg:text-[28px]">{value}</div>
      <div className="mt-1.5 text-xs font-medium text-foreground/80">{label}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="mt-3 rounded-2xl border border-dashed bg-muted/40 p-6 text-center text-xs text-muted-foreground">{text}</div>;
}

/* ---------- Foot diagram ---------- */

// Simple stylised foot outline with tap zones. Coordinates target a ~120x260 viewBox.
const ZONE_POSITIONS: Record<ZoneId, { cx: number; cy: number; r: number; label: string }> = {
  toes:        { cx: 60, cy: 30,  r: 14, label: "Toes" },
  hallux:      { cx: 32, cy: 32,  r: 12, label: "Hallux" },
  metatarsals: { cx: 60, cy: 75,  r: 22, label: "Met heads" },
  arch:        { cx: 60, cy: 125, r: 22, label: "Arch" },
  medial:      { cx: 32, cy: 125, r: 12, label: "Medial" },
  lateral:     { cx: 88, cy: 125, r: 12, label: "Lateral" },
  heel:        { cx: 60, cy: 210, r: 26, label: "Heel" },
  ankle:       { cx: 60, cy: 250, r: 14, label: "Ankle" },
};

function FootDiagram({
  side, view, selected, onSelect,
}: {
  side: FootSide; view: FootView;
  selected: { side: FootSide; zone: ZoneId } | null;
  onSelect: (z: ZoneId) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {side === "L" ? "Left" : "Right"} · {view}
      </div>
      <svg
        viewBox="0 0 120 280"
        className="h-[260px] w-full max-w-[140px]"
        style={{ transform: side === "R" ? "scaleX(-1)" : undefined }}
      >
        {/* Foot outline */}
        <path
          d="M 60 5
             C 82 5 96 22 96 45
             C 96 65 92 82 90 100
             C 92 130 100 155 100 185
             C 100 225 84 268 60 275
             C 36 268 20 225 20 185
             C 20 155 28 130 30 100
             C 28 82 24 65 24 45
             C 24 22 38 5 60 5 Z"
          fill="#FFFFFF"
          stroke="#B4C4C6"
          strokeWidth="1.5"
        />
        {/* Toe separators (plantar hint) */}
        {view === "plantar" && (
          <g stroke="#D3DEDF" strokeWidth="1" fill="none">
            <path d="M 40 18 Q 42 30 44 42" />
            <path d="M 52 15 Q 54 28 56 40" />
            <path d="M 68 15 Q 70 28 72 40" />
            <path d="M 80 18 Q 82 30 84 42" />
          </g>
        )}
        {/* Zones */}
        {ZONES.map(({ id }) => {
          const p = ZONE_POSITIONS[id];
          const active = selected?.side === side && selected.zone === id;
          return (
            <g key={id} onClick={() => onSelect(id)} className="cursor-pointer">
              <circle
                cx={p.cx} cy={p.cy} r={p.r}
                fill={active ? "var(--clin-purple)" : "transparent"}
                fillOpacity={active ? 0.25 : 0}
                stroke={active ? "var(--clin-purple)" : "transparent"}
                strokeWidth="2"
                className="transition-all hover:fill-[color:var(--clin-teal)] hover:fill-opacity-20 hover:stroke-[color:var(--clin-teal)]"
              />
              {active && (
                <circle cx={p.cx} cy={p.cy} r={p.r + 4} fill="none" stroke="var(--clin-purple)" strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" values={`${p.r + 2};${p.r + 8};${p.r + 2}`} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
