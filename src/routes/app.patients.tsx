import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { ChevronRight, Plus, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/patients")({ component: Patients });

function Patients() {
  const { patients } = useStore();
  const [q, setQ] = useState("");
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell
      title="Patients"
      right={
        <Button asChild size="sm" className="gradient-primary text-primary-foreground">
          <Link to="/app/patients/new"><Plus className="mr-1 h-4 w-4" />Add</Link>
        </Button>
      }
    >
      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patients" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <ul className="mt-4 space-y-2 px-5">
        {filtered.map((p) => (
          <li key={p.id}>
            <Link to="/app/patients/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {p.name.split(" ").map((x) => x[0]).slice(0,2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  {p.conditions.some((c) => /diabet/i.test(c)) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
                      <ShieldAlert className="h-3 w-3" />At risk
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.age} yrs · {p.conditions[0] || "No conditions on file"}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed bg-surface-muted p-8 text-center text-sm text-muted-foreground">
            No patients found.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
