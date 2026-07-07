import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { Calendar, Users, FileText, TrendingUp, ChevronRight, Bell, Crown, ClipboardPlus } from "lucide-react";
import { format, isToday, isFuture, differenceInDays } from "date-fns";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { nurse, patients, appointments, transactions } = useStore();
  const today = appointments.filter((a) => isToday(new Date(a.date))).sort((a, b) => a.date.localeCompare(b.date));
  const upcomingFU = patients.filter((p) => p.nextFollowUp && isFuture(new Date(p.nextFollowUp))).slice(0, 3);
  const notesToDo = Math.max(0, today.length - 1); // demo
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const revenue = transactions
    .filter((t) => t.type === "income" && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <AppShell>
      <div className="gradient-hero px-5 pb-8 pt-10 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs opacity-80">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}</div>
            <div className="text-2xl font-bold">{nurse?.name?.split(" ")[0] || "Nurse"}</div>
            <div className="text-xs opacity-80">{format(new Date(), "EEEE, MMM d")}</div>
          </div>
          <Link to="/app/subscription" className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
            <Bell className="h-5 w-5" />
          </Link>
        </div>

        {nurse?.plan === "trial" && (
          <Link to="/app/subscription" className="mt-5 flex items-center justify-between rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5" />
              <div className="text-sm">
                <div className="font-semibold">Free trial</div>
                <div className="text-xs opacity-80">
                  {Math.max(0, differenceInDays(new Date(nurse.trialEndsAt), new Date()))} days left
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="-mt-6 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Calendar} label="Today" value={today.length} sub="appointments" tint="primary" />
          <Stat icon={Users} label="Patients" value={patients.length} sub="active" tint="accent" />
          <Stat icon={FileText} label="Notes" value={notesToDo} sub="to complete" tint="warning" />
          <Stat icon={TrendingUp} label="This month" value={`$${revenue.toLocaleString()}`} sub="revenue" tint="success" />
        </div>
      </div>

      <Section title="Today's schedule" href="/app/calendar">
        {today.length === 0 ? (
          <Empty text="No visits scheduled today." />
        ) : (
          <ul className="space-y-2">
            {today.map((a) => (
              <li key={a.id}>
                <Link to="/app/patients/$id" params={{ id: a.patientId }} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-primary">
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
                <Link to="/app/patients/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {p.name.split(" ").map((x) => x[0]).slice(0,2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Due {format(new Date(p.nextFollowUp!), "MMM d")}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Quick actions">
        <div className="grid grid-cols-2 gap-3">
          <QuickAction to="/app/soap" icon={ClipboardPlus} label="New SOAP note" />
          <QuickAction to="/app/assistant" icon={FileText} label="AI assistant" />
        </div>
      </Section>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, sub, tint }: any) {
  const tintCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent text-primary",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
  };
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-soft">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${tintCls[tint]}`}><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label} · {sub}</div>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="px-5 pt-7">
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
    <Link to={to} className="flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-semibold">{label}</div>
    </Link>
  );
}
