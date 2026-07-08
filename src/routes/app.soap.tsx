import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, PLAN_LIMITS, summarizeAssessment } from "@/lib/store";
import { generateSoapNote } from "@/lib/soap.functions";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Save, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/app/soap")({
  component: SoapNote,
  validateSearch: searchSchema,
});

function SoapNote() {
  const { patientId } = Route.useSearch();
  const { patients, addTreatment, addTransaction, ageOf, nurse, useAiCredit, latestAssessmentFor } = useStore();
  const [pid, setPid] = useState(patientId || patients[0]?.id || "");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [soap, setSoap] = useState<{ s: string; o: string; a: string; p: string } | null>(null);
  const [fee, setFee] = useState(75);
  const generate = useServerFn(generateSoapNote);
  const latestAssessment = pid ? latestAssessmentFor(pid) : undefined;

  const patient = patients.find((p) => p.id === pid);
  const limit = PLAN_LIMITS[nurse?.plan || "free"].aiPerMonth;
  const used = nurse?.aiUsedThisMonth || 0;
  const outOfCredit = used >= limit;

  const gen = async () => {
    if (!patient) {
      toast.error("Select a patient first.");
      return;
    }
    if (!brief.trim()) {
      toast.error("Add a few quick visit notes to generate from.");
      return;
    }
    if (!useAiCredit()) {
      toast.error("You've used all AI notes on the Free plan this month.");
      return;
    }
    setLoading(true);
    try {
      const age = ageOf(patient.dob);
      const out = await generate({
        data: {
          patientName: patient.name,
          age: age || null,
          conditions: patient.conditions,
          diabetesStatus: patient.diabetesStatus,
          allergies: patient.allergies || "",
          briefNotes: brief,
          assessmentSummary: latestAssessment ? summarizeAssessment(latestAssessment) : "",
        },
      });
      setSoap(out);
      toast.success("SOAP note generated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate note";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const save = () => {
    if (!soap || !patient) return;
    addTreatment(patient.id, { date: new Date().toISOString(), soap, fee });
    addTransaction({ type: "income", amount: fee, date: new Date().toISOString(), category: "Visit", patientId: patient.id });
    toast.success("Note saved to patient record");
    setSoap(null); setBrief("");
  };

  return (
    <AppShell title="AI SOAP Note Generator">
      <Container className="max-w-4xl py-6">
        {nurse?.plan === "free" && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Crown className="h-5 w-5" /></div>
            <div className="flex-1 text-sm">
              <div className="font-semibold">Free plan · {used}/{limit} AI notes used this month</div>
              <div className="text-xs text-muted-foreground">Upgrade to Premium for unlimited AI SOAP notes.</div>
            </div>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/app/subscription">Upgrade</Link>
            </Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-surface p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Draft with AI
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <Select value={pid} onValueChange={setPid}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quick visit notes</Label>
                <Textarea rows={8} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What did you observe and do?" />
              </div>
              {patient && (
                latestAssessment ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                    <div className="mb-1 font-semibold text-primary">Attached: latest foot assessment</div>
                    <div className="text-muted-foreground">{summarizeAssessment(latestAssessment)}</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-dashed bg-surface-muted p-3 text-xs">
                    <span className="text-muted-foreground">No assessment on file for this patient.</span>
                    <Link to="/app/assess" search={{ patientId: patient.id }} className="font-semibold text-primary hover:underline">
                      New assessment
                    </Link>
                  </div>
                )
              )}
              <Button onClick={gen} disabled={loading || !patient || outOfCredit} className="w-full gradient-primary text-primary-foreground">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate SOAP note</>}
              </Button>
              {outOfCredit && <p className="text-center text-xs text-muted-foreground">Upgrade to Premium for unlimited notes.</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-surface p-5 shadow-soft">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review & edit</div>
            {!soap ? (
              <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-surface-muted text-center text-sm text-muted-foreground">
                Your AI-generated SOAP note will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {(["s","o","a","p"] as const).map((k) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="uppercase">{k === "s" ? "Subjective" : k === "o" ? "Objective" : k === "a" ? "Assessment" : "Plan"}</Label>
                    <Textarea rows={k === "o" || k === "p" ? 4 : 3} value={soap[k]} onChange={(e) => setSoap({ ...soap, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>Visit fee ($)</Label>
                  <Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} />
                </div>
                <Button onClick={save} size="lg" className="w-full gradient-primary text-primary-foreground">
                  <Save className="mr-2 h-4 w-4" /> Save to patient record
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
