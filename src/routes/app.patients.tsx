import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, PLAN_LIMITS } from "@/lib/store";
import { ChevronRight, Plus, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/patients")({ component: Patients });

function Patients() {
  const { patients, ageOf, nurse } = useStore();
  const [q, setQ] = useState("");
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const limit = PLAN_LIMITS[nurse?.plan || "free"].patients;

  return (
    <AppShell
      title="Patients"
      actions={
        <Button asChild size="sm" className="gradient-primary text-primary-foreground">
          <Link to="/app/patients/new"><Plus className="mr-1 h-4 w-4" />Add patient</Link>
        </Button>
      }
    >
      <Container className="py-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search patients by name" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">
            {patients.length} {patients.length === 1 ? "patient" : "patients"}
            {limit !== Infinity && ` · ${patients.length}/${limit} on Free`}
          </div>
        </div>

        <ul className="mt-5 grid gap-2 lg:grid-cols-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link to="/app/patients/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft hover:shadow-card">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {p.name.split(" ").map((x) => x[0]).slice(0,2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    {p.diabetesStatus !== "none" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
                        <ShieldAlert className="h-3 w-3" />Diabetic
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {ageOf(p.dob)} yrs · {p.conditions[0] || "No conditions on file"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-2xl border border-dashed bg-surface-muted p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              No patients found.
            </li>
          )}
        </ul>
      </Container>
    </AppShell>
  );
}
