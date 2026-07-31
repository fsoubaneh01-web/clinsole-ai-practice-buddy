import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type FootAssessmentInput, type RiskLevel } from "@/lib/store";
import { ArrowLeft, Camera, Loader2, Save, ShieldAlert, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/app/assess")({
  component: AssessPage,
  validateSearch: searchSchema,
});

const emptyForm = (): FootAssessmentInput => ({
  patientId: "",
  leftFoot: false,
  rightFoot: false,
  skinDry: false, skinCallus: false, skinCorns: false, skinFissures: false, skinUlcer: false, skinInfection: false,
  nailsThickened: false, nailsFungal: false, nailsIngrown: false, nailsTrimmed: false, nailsDebrided: false,
  pulsesPresent: "both",
  capillaryRefill: "<3s",
  edema: "none",
  skinTemperature: "warm",
  protectiveSensation: "intact",
  monofilamentFindings: "",
  neuropathyRisk: "none",
  riskLevel: "low",
  notes: "",
});

function AssessPage() {
  const { patientId } = Route.useSearch();
  const nav = useNavigate();
  const { patients, addFootAssessment } = useStore();
  const [f, setF] = useState<FootAssessmentInput>(() => ({ ...emptyForm(), patientId: patientId || patients[0]?.id || "" }));
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const patient = patients.find((p) => p.id === f.patientId);

  const set = <K extends keyof FootAssessmentInput>(k: K, v: FootAssessmentInput[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles((s) => [...s, ...list].slice(0, 6));
    e.target.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) { toast.error("Choose a patient."); return; }
    if (!f.leftFoot && !f.rightFoot) { toast.error("Select which foot was assessed."); return; }
    setBusy(true);
    const res = await addFootAssessment(f, files);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Assessment saved to visit history");
    nav({ to: "/app/patients/$id", params: { id: patient.id } });
  };

  return (
    <AppShell
      title="Foot Assessment"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/patients"><ArrowLeft className="mr-1 h-4 w-4" />Cancel</Link>
        </Button>
      }
    >
      <Container className="max-w-3xl py-6">
        <form onSubmit={submit} className="space-y-5">
          <Section title="Patient & involvement">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Patient">
                <Select value={f.patientId} onValueChange={(v) => set("patientId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-end gap-4">
                <CheckField label="Left foot" checked={f.leftFoot} onChange={(v) => set("leftFoot", v)} />
                <CheckField label="Right foot" checked={f.rightFoot} onChange={(v) => set("rightFoot", v)} />
              </div>
            </div>
          </Section>

          <Section title="Skin">
            <Grid>
              {[
                ["skinDry", "Dry skin"],
                ["skinCallus", "Callus"],
                ["skinCorns", "Corns"],
                ["skinFissures", "Fissures"],
                ["skinUlcer", "Ulcer"],
                ["skinInfection", "Infection"],
              ].map(([k, l]) => (
                <CheckField key={k} label={l} checked={f[k as keyof FootAssessmentInput] as boolean}
                  onChange={(v) => set(k as keyof FootAssessmentInput, v as never)} />
              ))}
            </Grid>
          </Section>

          <Section title="Nails">
            <Grid>
              {[
                ["nailsThickened", "Thickened"],
                ["nailsFungal", "Fungal appearance"],
                ["nailsIngrown", "Ingrown"],
                ["nailsTrimmed", "Trimmed"],
                ["nailsDebrided", "Debrided"],
              ].map(([k, l]) => (
                <CheckField key={k} label={l} checked={f[k as keyof FootAssessmentInput] as boolean}
                  onChange={(v) => set(k as keyof FootAssessmentInput, v as never)} />
              ))}
            </Grid>
          </Section>

          <Section title="Circulation">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Pedal pulses">
                <Select value={f.pulsesPresent} onValueChange={(v) => set("pulsesPresent", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Present, both feet</SelectItem>
                    <SelectItem value="left">Left only</SelectItem>
                    <SelectItem value="right">Right only</SelectItem>
                    <SelectItem value="diminished">Diminished</SelectItem>
                    <SelectItem value="none">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Capillary refill">
                <Select value={f.capillaryRefill} onValueChange={(v) => set("capillaryRefill", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<3s">&lt; 3 seconds (normal)</SelectItem>
                    <SelectItem value=">3s">&gt; 3 seconds (delayed)</SelectItem>
                    <SelectItem value="not_assessed">Not assessed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Edema">
                <Select value={f.edema} onValueChange={(v) => set("edema", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Skin temperature">
                <Select value={f.skinTemperature} onValueChange={(v) => set("skinTemperature", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Neurological">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Protective sensation">
                <Select value={f.protectiveSensation} onValueChange={(v) => set("protectiveSensation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intact">Intact</SelectItem>
                    <SelectItem value="reduced">Reduced</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Neuropathy risk">
                <Select value={f.neuropathyRisk} onValueChange={(v) => set("neuropathyRisk", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Monofilament findings (10g)" className="md:col-span-2">
                <Input value={f.monofilamentFindings} onChange={(e) => set("monofilamentFindings", e.target.value)}
                  placeholder="e.g. 8/10 sites detected on right foot, 5/10 on left" />
              </Field>
            </div>
          </Section>

          <Section title="Risk level">
            <div className="grid grid-cols-3 gap-3">
              {(["low","moderate","high"] as RiskLevel[]).map((r) => {
                const active = f.riskLevel === r;
                const color = r === "low" ? "text-success border-success/40 bg-success/10"
                  : r === "moderate" ? "text-warning-foreground border-warning/50 bg-warning/15"
                  : "text-destructive border-destructive/40 bg-destructive/10";
                return (
                  <button type="button" key={r} onClick={() => set("riskLevel", r)}
                    className={`rounded-2xl border-2 p-3 text-center text-sm font-semibold uppercase transition ${active ? color : "border-border bg-surface text-muted-foreground hover:bg-muted"}`}>
                    <ShieldAlert className="mx-auto mb-1 h-5 w-5" />{r}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Notes">
            <Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="Additional observations, patient concerns, wound measurements…" />
          </Section>

          <Section title="Clinical photos" hint="Up to 6 photos. Stored privately per nurse.">
            <div className="flex flex-wrap gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl border">
                  <img src={p.url} alt="preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setFiles((s) => s.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length < 6 && (
                <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:bg-muted">
                  <Camera className="h-6 w-6" />
                  <input type="file" accept="image/*" multiple hidden onChange={onFiles} />
                </label>
              )}
            </div>
          </Section>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => nav({ to: "/app/patients" })}>Cancel</Button>
            <Button type="submit" disabled={busy || !patient} className="flex-1 gradient-primary text-primary-foreground">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save assessment</>}
            </Button>
          </div>
        </form>
      </Container>
    </AppShell>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-soft">
      <div className="mb-3">
        <div className="text-sm font-semibold">{title}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className || ""}`}><Label>{label}</Label>{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{children}</div>;
}
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border bg-surface-muted px-3 py-2.5 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <span>{label}</span>
    </label>
  );
}
