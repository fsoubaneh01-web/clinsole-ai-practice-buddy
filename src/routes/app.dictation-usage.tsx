import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Container } from "@/components/AppShell";
import { getDictationUsage } from "@/lib/dictation-usage.functions";
import { Loader2, Mic } from "lucide-react";

export const Route = createFileRoute("/app/dictation-usage")({
  component: DictationUsagePage,
  head: () => ({
    meta: [
      { title: "Dictation Usage & Cost | ClinSole AI" },
      { name: "description", content: "Monthly voice dictation minutes and estimated transcription cost per nurse." },
      { property: "og:title", content: "Dictation Usage & Cost | ClinSole AI" },
      { property: "og:description", content: "Monthly voice dictation minutes and estimated transcription cost per nurse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function DictationUsagePage() {
  const fetchUsage = useServerFn(getDictationUsage);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dictation-usage"],
    queryFn: () => fetchUsage(),
  });

  const totalMinutes = (data?.rows ?? []).reduce((s, r) => s + r.minutes, 0);
  const totalCost = (data?.rows ?? []).reduce((s, r) => s + r.cost, 0);

  return (
    <AppShell title="Dictation usage">
      <Container className="py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Dictation usage &amp; cost</h1>
          <p className="text-sm text-muted-foreground">
            {data?.isAdmin
              ? "All nurses, grouped by month. Billed at $0.075 per minute."
              : "Your dictation usage, grouped by month. Billed at $0.075 per minute."}
          </p>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border bg-surface p-5 shadow-soft">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Total minutes</div>
            <div className="mt-2 text-3xl font-bold">{totalMinutes.toFixed(1)}</div>
          </div>
          <div className="rounded-3xl border bg-surface p-5 shadow-soft">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Estimated cost</div>
            <div className="mt-2 text-3xl font-bold">${totalCost.toFixed(2)}</div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading usage…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Could not load usage data.
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto rounded-3xl border bg-surface shadow-soft">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Nurse</th>
                  <th className="p-3 text-right">Sessions</th>
                  <th className="p-3 text-right">Minutes</th>
                  <th className="p-3 text-right">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((r) => (
                  <tr key={`${r.month}-${r.userId}`} className="border-b last:border-0">
                    <td className="p-3 font-medium">{r.month}</td>
                    <td className="p-3 text-muted-foreground">
                      {r.isSelf ? "You" : `${r.userId.slice(0, 8)}…`}
                    </td>
                    <td className="p-3 text-right">{r.sessions}</td>
                    <td className="p-3 text-right">{r.minutes.toFixed(1)}</td>
                    <td className="p-3 text-right">${r.cost.toFixed(2)}</td>
                  </tr>
                ))}
                {(data?.rows ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Mic className="mx-auto mb-2 h-5 w-5" />
                      No dictation recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </AppShell>
  );
}
