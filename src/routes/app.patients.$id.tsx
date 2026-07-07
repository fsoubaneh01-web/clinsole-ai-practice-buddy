import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { ArrowLeft, CalendarPlus, ClipboardPlus, MapPin, Phone, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/app/patients/$id")({
  component: PatientProfile,
});

function PatientProfile() {
  const { id } = Route.useParams();
  const { patients } = useStore();
  const p = patients.find((x) => x.id === id);
  if (!p) throw notFound();

  const initials = p.name.split(" ").map((x) => x[0]).slice(0, 2).join("");

  return (
    <AppShell
      title="Patient"
      right={
        <Link to="/app/patients" className="text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /></Link>
      }
    >
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-2xl font-bold">{initials}</div>
          <div className="min-w-0">
            <div className="truncate text-xl font-bold">{p.name}</div>
            <div className="text-sm opacity-85">{p.age} years old</div>
          </div>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          {p.phone && <div className="flex items-center gap-2 opacity-90"><Phone className="h-4 w-4" />{p.phone}</div>}
          {p.address && <div className="flex items-center gap-2 opacity-90"><MapPin className="h-4 w-4" />{p.address}</div>}
        </div>
      </div>

      <div className="-mt-4 mx-5 flex gap-2">
        <Button asChild className="flex-1 gradient-primary text-primary-foreground shadow-card">
          <Link to="/app/soap" search={{ patientId: p.id } as any}>
            <ClipboardPlus className="mr-1 h-4 w-4" />New SOAP
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 bg-surface">
          <Link to="/app/calendar"><CalendarPlus className="mr-1 h-4 w-4" />Book</Link>
        </Button>
      </div>

      <div className="px-5 pt-5">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="assess">Assess</TabsTrigger>
            <TabsTrigger value="treat">Treat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card title="Medical conditions">
              <div className="flex flex-wrap gap-2">
                {p.conditions.length ? p.conditions.map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full">
                    {/diabet|vasc|neuro/i.test(c) && <ShieldAlert className="mr-1 h-3 w-3" />}
                    {c}
                  </Badge>
                )) : <div className="text-sm text-muted-foreground">None recorded.</div>}
              </div>
            </Card>
            <Card title="Notes">
              <p className="text-sm text-muted-foreground">{p.notes || "No notes yet."}</p>
            </Card>
            {p.nextFollowUp && (
              <Card title="Next follow-up">
                <div className="text-sm font-medium">{format(new Date(p.nextFollowUp), "EEEE, MMM d yyyy")}</div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {p.treatments.length === 0 && <Empty text="No visit history yet." />}
            {p.treatments.map((t) => (
              <div key={t.id} className="rounded-2xl border bg-surface p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{format(new Date(t.date), "MMM d, yyyy")}</div>
                  <Badge variant="outline">${t.fee}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div><b className="text-foreground">A:</b> {t.soap.a}</div>
                  <div><b className="text-foreground">P:</b> {t.soap.p}</div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="assess" className="mt-4 space-y-2">
            {p.assessments.length === 0 && <Empty text="No foot assessments recorded." />}
            {p.assessments.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-surface p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{format(new Date(a.date), "MMM d, yyyy")}</div>
                  <RiskBadge risk={a.risk} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="treat" className="mt-4 space-y-2">
            {p.treatments.length === 0 && <Empty text="No treatments yet." />}
            {p.treatments.map((t) => (
              <div key={t.id} className="rounded-2xl border bg-surface p-4 shadow-soft">
                <div className="mb-2 text-sm font-semibold">{format(new Date(t.date), "MMM d, yyyy")}</div>
                <div className="space-y-1 text-xs">
                  <div><b>S:</b> {t.soap.s}</div>
                  <div><b>O:</b> {t.soap.o}</div>
                  <div><b>A:</b> {t.soap.a}</div>
                  <div><b>P:</b> {t.soap.p}</div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-soft">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-success/15 text-success",
    medium: "bg-warning/20 text-warning-foreground",
    high: "bg-destructive/15 text-destructive",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${map[risk]}`}>{risk} risk</span>;
}
