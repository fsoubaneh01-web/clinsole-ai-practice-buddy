import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { generateSOAP } from "@/lib/ai-mock";
import { useState } from "react";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/app/soap")({
  component: SoapNote,
  validateSearch: searchSchema,
});

function SoapNote() {
  const { patientId } = Route.useSearch();
  const { patients, addTreatment, addTransaction } = useStore();
  const [pid, setPid] = useState(patientId || patients[0]?.id || "");
  const [brief, setBrief] = useState("Routine nail care, mild callus 1st MTP right, patient reports occasional numbness at night.");
  const [loading, setLoading] = useState(false);
  const [soap, setSoap] = useState<{ s: string; o: string; a: string; p: string } | null>(null);
  const [fee, setFee] = useState(75);

  const patient = patients.find((p) => p.id === pid);

  const gen = async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const out = await generateSOAP({
        patientName: patient.name,
        age: patient.age,
        conditions: patient.conditions,
        briefNotes: brief,
      });
      setSoap(out);
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!soap || !patient) return;
    addTreatment(patient.id, { date: new Date().toISOString(), soap, fee });
    addTransaction({ type: "income", amount: fee, date: new Date().toISOString(), category: "Visit", patientId: patient.id });
    toast.success("Note saved to patient record");
    setSoap(null);
    setBrief("");
  };

  return (
    <AppShell title="AI SOAP Note">
      <div className="space-y-4 px-5 pt-4">
        <div className="rounded-2xl border bg-surface p-4 shadow-soft">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
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
              <Label>Quick notes from visit</Label>
              <Textarea rows={5} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What did you observe and do?" />
            </div>
            <Button onClick={gen} disabled={loading || !patient} className="w-full gradient-primary text-primary-foreground">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate SOAP note</>}
            </Button>
          </div>
        </div>

        {soap && (
          <div className="space-y-3 rounded-2xl border bg-surface p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review & edit</div>
            {(["s","o","a","p"] as const).map((k) => (
              <div key={k} className="space-y-1.5">
                <Label className="uppercase">{k === "s" ? "Subjective" : k === "o" ? "Objective" : k === "a" ? "Assessment" : "Plan"}</Label>
                <Textarea rows={k === "o" || k === "p" ? 4 : 3} value={soap[k]} onChange={(e) => setSoap({ ...soap, [k]: e.target.value })} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Visit fee</Label>
              <Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} />
            </div>
            <Button onClick={save} size="lg" className="w-full gradient-primary text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Save to patient record
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
