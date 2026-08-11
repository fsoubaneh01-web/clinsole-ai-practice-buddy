import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { endOfWeek, format, isSameDay, isToday, isTomorrow } from "date-fns";
import { ChevronRight, CalendarClock } from "lucide-react";

import { AppShell, Container } from "@/components/AppShell";
import { useStore, type Appointment } from "@/lib/store";

export const Route = createFileRoute("/app/upcoming")({
  head: () => ({
    meta: [
      { title: "Upcoming Visits · ClinSole AI" },
      { name: "description", content: "All future scheduled foot care visits, grouped by day." },
      { property: "og:title", content: "Upcoming Visits · ClinSole AI" },
      { property: "og:description", content: "All future scheduled foot care visits, grouped by day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UpcomingVisits,
});

type Group = { key: string; label: string; items: Appointment[] };

function UpcomingVisits() {
  const { appointments } = useStore();

  const groups = useMemo<Group[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const future = appointments
      .filter((a) => new Date(a.date) >= startOfToday)
      .sort((a, b) => a.date.localeCompare(b.date));

    const buckets: Group[] = [
      { key: "today", label: "Today", items: [] },
      { key: "tomorrow", label: "Tomorrow", items: [] },
      { key: "week", label: "This Week", items: [] },
      { key: "later", label: "Later", items: [] },
    ];

    for (const a of future) {
      const d = new Date(a.date);
      if (isToday(d)) buckets[0].items.push(a);
      else if (isTomorrow(d)) buckets[1].items.push(a);
      else if (d <= weekEnd || isSameDay(d, weekEnd)) buckets[2].items.push(a);
      else buckets[3].items.push(a);
    }

    return buckets.filter((b) => b.items.length > 0);
  }, [appointments]);

  const total = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <AppShell title="Upcoming Visits">
      <Container className="py-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          {total} upcoming visit{total === 1 ? "" : "s"} from today onward
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed bg-surface-muted p-8 text-center text-sm text-muted-foreground">
            No upcoming visits scheduled.
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.key}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h2>
                  <span className="text-xs text-muted-foreground">{g.items.length}</span>
                </div>
                <ul className="grid gap-2 lg:grid-cols-2">
                  {g.items.map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/app/patients/$id"
                        params={{ id: a.patientId }}
                        className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft transition-shadow hover:shadow-card"
                      >
                        <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-primary/10 py-2 text-primary">
                          <div className="text-sm font-bold">{format(new Date(a.date), "HH:mm")}</div>
                          <div className="text-[10px] opacity-70">{format(new Date(a.date), "MMM d")}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{a.patientName}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {format(new Date(a.date), "EEE, MMM d")} · {a.type || "Visit"}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Container>
    </AppShell>
  );
}

