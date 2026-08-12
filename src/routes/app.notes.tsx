import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { FileText, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";

import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { pendingNotes } from "@/lib/pending-notes";

export const Route = createFileRoute("/app/notes")({
  component: NotesToFinish,
  head: () => ({
    meta: [
      { title: "Notes to Finish · ClinSole AI" },
      { name: "description", content: "Visits completed without a saved SOAP note, ready for the nurse to finish and sign off." },
      { property: "og:title", content: "Notes to Finish · ClinSole AI" },
      { property: "og:description", content: "Visits completed without a saved SOAP note, ready for the nurse to finish and sign off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function label(date: Date) {
  if (isToday(date)) return `Today · ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday · ${format(date, "h:mm a")}`;
  return format(date, "EEE MMM d · h:mm a");
}

function NotesToFinish() {
  const { appointments, patients } = useStore();
  const items = useMemo(() => pendingNotes(appointments, patients), [appointments, patients]);

  return (
    <AppShell title="Notes to Finish">
      <Container className="max-w-3xl py-6">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-soft">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <div className="font-semibold">{items.length} visit{items.length === 1 ? "" : "s"} awaiting a SOAP note</div>
            <div className="text-xs text-muted-foreground">
              Completed visits from the last 30 days with no saved note for that patient on the visit day.
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-2xl border border-dashed bg-surface-muted p-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <div className="text-sm font-semibold">All caught up</div>
            <div className="text-xs text-muted-foreground">Every completed visit has a saved SOAP note.</div>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.appointmentId} className="rounded-2xl border bg-surface p-4 shadow-soft transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Link
                    to="/app/patients/$id"
                    params={{ id: n.patientId }}
                    className="min-w-0 flex-1"
                  >
                    <div className="truncate text-sm font-semibold">{n.patientName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {label(new Date(n.date))} · {n.visitType}
                    </div>
                  </Link>
                  <Button asChild size="sm" className="gradient-primary text-primary-foreground">
                    <Link to="/app/soap" search={{ patientId: n.patientId }}>
                      <Sparkles className="mr-1 h-3.5 w-3.5" />Finish
                    </Link>
                  </Button>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </AppShell>
  );
}
