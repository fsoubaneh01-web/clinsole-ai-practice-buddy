import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { useStore, PLAN_LIMITS } from "@/lib/store";
import { Calendar, Users, FileText, TrendingUp, ChevronRight, ClipboardPlus, Crown, Sparkles, Bell } from "lucide-react";
import { format, isToday, isFuture, isPast, addDays } from "date-fns";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { nurse, patients, appointments, transactions } = useStore();
  const now = new Date();
  const in7 = addDays(now, 7);
  const today = appointments.filter((a) => isToday(new Date(a.date))).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = appointments
    .filter((a) => { const d = new Date(a.date); return d > now && !isToday(d); })
    .slice(0, 5);
  const expectedRevenue = appointments
    .filter((a) => { const d = new Date(a.date); return d >= now && d <= in7; })
    .reduce((s, a) => s + (a.expectedFee || 0), 0);
  const followUpsDue = patients
    .filter((p) => p.nextFollowUp && (isPast(new Date(p.nextFollowUp)) || new Date(p.nextFollowUp) <= in7))
    .sort((a, b) => (a.nextFollowUp || "").localeCompare(b.nextFollowUp || ""));
  const upcomingFU = followUpsDue.slice(0, 5);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const revenue = transactions
    .filter((t) => t.type === "income" && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + t.amount, 0);

  const limits = PLAN_LIMITS[nurse?.plan || "free"];

  return (
    <AppShell title="Dashboard">
      <Container className="py-6 lg:py-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d")}
            </div>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
              {nurse?.name ? `, ${nurse.name.split(" ")[0]}` : ""}.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Here's what your practice looks like today.</p>
          </div>
          {nurse?.plan === "free" && (
            <Link to="/app/subscription" className="inline-flex items-center gap-3 self-start rounded-2xl border bg-surface px-4 py-3 shadow-soft hover:shadow-card">
              <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground"><Crown className="h-4 w-4" /></div>
              <div className="text-xs leading-tight">
                <div className="font-semibold">Free plan</div>
                <div className="text-muted-foreground">{patients.length}/{limits.patients} patients · {nurse.aiUsedThisMonth}/{limits.aiPerMonth} AI notes</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          <Stat icon={Calendar} label="Today's visits" value={today.length} tint="primary" />
          <Stat icon={Users} label="Follow-ups due" value={followUpsDue.length} tint="warning" />
          <Stat icon={TrendingUp} label="Expected (7d)" value={`$${expectedRevenue.toLocaleString()}`} tint="accent" />
          <Stat icon={FileText} label="This month" value={`$${revenue.toLocaleString()}`} tint="success" />
        </div>


        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Section title="Today's schedule" href="/app/calendar" className="lg:col-span-2">
            {today.length === 0 ? (
              <Empty text="No visits scheduled today." />
            ) : (
              <ul className="space-y-2">
                {today.map((a) => (
                  <li key={a.id}>
                    <Link to="/app/patients/$id" params={{ id: a.patientId }} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft hover:shadow-card">
                      <div className="grid h-12 w-14 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                        <span className="text-sm font-bold">{format(new Date(a.date), "HH:mm")}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{a.patientName}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.type} · {a.duration} min</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Upcoming follow-ups" href="/app/patients">
            {upcomingFU.length === 0 ? (
              <Empty text="No follow-ups on the horizon." />
            ) : (
              <ul className="space-y-2">
                {upcomingFU.map((p) => (
                  <li key={p.id}>
                    <Link to="/app/patients/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft hover:shadow-card">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {p.name.split(" ").map((x) => x[0]).slice(0,2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">Due {format(new Date(p.nextFollowUp!), "MMM d")}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <Section title="Quick actions" className="mt-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuickAction to="/app/soap" icon={ClipboardPlus} label="New SOAP note" />
            <QuickAction to="/app/patients/new" icon={Users} label="Add patient" />
            <QuickAction to="/app/calendar" icon={Calendar} label="Book visit" />
            <QuickAction to="/app/assistant" icon={Sparkles} label="AI assistant" />
          </div>
        </Section>
      </Container>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tint }: any) {
  const tintCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent text-primary",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
  };
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-soft lg:p-5">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${tintCls[tint]}`}><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-2xl font-bold leading-none lg:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, href, children, className }: { title: string; href?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {href && <Link to={href} className="text-xs font-medium text-primary">View all</Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function QuickAction({ to, icon: Icon, label }: any) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-soft hover:shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-semibold">{label}</div>
    </Link>
  );
}
