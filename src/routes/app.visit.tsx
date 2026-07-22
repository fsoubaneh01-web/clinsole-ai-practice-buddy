import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { format, addDays } from "date-fns";
import {
  Play, User, Footprints, Camera, Mic, FileText, DollarSign,
  BookOpen, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, Sparkles, X, Image as ImageIcon, Check, Printer,
} from "lucide-react";
import { toast } from "sonner";


import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FootAssessmentModule, type FootObservation } from "@/components/FootAssessmentModule";
import { useStore, summarizeAssessment } from "@/lib/store";
import { generateSoapNote } from "@/lib/soap.functions";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/app/visit")({
  component: VisitFlow,
  validateSearch: searchSchema,
});

type StepId =
  | "start" | "summary" | "assessment" | "photos" | "dictation"
  | "soap" | "billing" | "education" | "followup" | "finish";

const STEPS: { id: StepId; label: string; icon: any }[] = [
  { id: "start",      label: "Start Visit",       icon: Play },
  { id: "summary",    label: "Patient Summary",   icon: User },
  { id: "assessment", label: "Foot Assessment",   icon: Footprints },
  { id: "photos",     label: "Clinical Photos",   icon: Camera },
  { id: "dictation",  label: "Voice Dictation",   icon: Mic },
  { id: "soap",       label: "AI SOAP Note",      icon: FileText },
  { id: "billing",    label: "Billing",           icon: DollarSign },
  { id: "education",  label: "Patient Education", icon: BookOpen },
  { id: "followup",   label: "Schedule Follow-up",icon: CalendarPlus },
  { id: "finish",     label: "Finish Visit",      icon: CheckCircle2 },
];

const EDUCATION_TOPICS = [
  { id: "daily-inspect", title: "Daily foot inspection", body: "Check tops, bottoms, and between toes daily for cuts, blisters, redness, or swelling. Use a mirror if needed." },
  { id: "footwear",      title: "Proper footwear",      body: "Wear well-fitted, closed-toe shoes. Avoid walking barefoot. Check inside shoes before wearing." },
  { id: "moisturize",    title: "Skin care & moisturizing", body: "Moisturize tops and bottoms of feet daily. Avoid lotion between toes to reduce fungal risk." },
  { id: "nail-care",     title: "Safe nail trimming",   body: "Trim nails straight across. See your nurse for thick or ingrown nails." },
  { id: "glucose",       title: "Blood glucose control", body: "Keep blood sugar in target range — high glucose slows wound healing and increases infection risk." },
  { id: "when-to-call",  title: "When to seek care",    body: "Call promptly for any new wound, drainage, redness, foul odor, or unexplained pain." },
];

function VisitFlow() {
  const { patientId } = Route.useSearch();
  const navigate = useNavigate();
  const {
    patients, nurse, ageOf, latestAssessmentFor,
    addTreatment, addTransaction, addAppointment,
  } = useStore();
  const generate = useServerFn(generateSoapNote);

  const [stepIdx, setStepIdx] = useState(0);
  const [pid, setPid] = useState(patientId || patients[0]?.id || "");
  const [observations, setObservations] = useState<FootObservation[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string; note: string }[]>([]);
  const [dictation, setDictation] = useState("");
  const [soap, setSoap] = useState<{ s: string; o: string; a: string; p: string } | null>(null);
  const [soapLoading, setSoapLoading] = useState(false);
  const [fee, setFee] = useState(75);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["daily-inspect", "footwear"]);
  const [followupDate, setFollowupDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [followupTime, setFollowupTime] = useState("10:00");
  const [followupType, setFollowupType] = useState("Foot care follow-up");
  const [visitStartedAt, setVisitStartedAt] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const step = STEPS[stepIdx];
  const patient = patients.find((p) => p.id === pid);
  const latestAssessment = pid ? latestAssessmentFor(pid) : undefined;

  const canAdvance = useMemo(() => {
    if (step.id === "start") return !!pid;
    if (step.id === "soap") return !!soap;
    return true;
  }, [step.id, pid, soap]);

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));
  const goto = (i: number) => setStepIdx(i);

  const addPhotoFile = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f);
      setPhotos((p) => [{ id: crypto.randomUUID(), url, note: "" }, ...p]);
    });
  };

  const generateSoap = async () => {
    if (!patient) return toast.error("Select a patient first.");
    setSoapLoading(true);
    try {
      const age = ageOf(patient.dob);
      const obsSummary = observations
        .slice(0, 6)
        .map((o) => `${o.side === "L" ? "Left" : "Right"} ${o.regionLabel}: ${o.text || "noted"}${o.pain ? ` · pain ${o.pain}` : ""}`)
        .join("; ");
      const brief = [
        dictation.trim(),
        obsSummary && `Findings: ${obsSummary}`,
        photos.length && `${photos.length} clinical photo(s) captured.`,
      ].filter(Boolean).join("\n");

      const out = await generate({
        data: {
          patientName: patient.name,
          age: age || null,
          conditions: patient.conditions,
          diabetesStatus: patient.diabetesStatus,
          allergies: patient.allergies || "",
          briefNotes: brief || "Routine foot care visit.",
          assessmentSummary: latestAssessment ? summarizeAssessment(latestAssessment) : "",
        },
      });
      setSoap(out);
      toast.success("SOAP note generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate note");
    } finally {
      setSoapLoading(false);
    }
  };

  const finishVisit = async () => {
    if (!patient || !soap) return;
    setFinishing(true);
    try {
      const now = new Date().toISOString();
      addTreatment(patient.id, { date: now, soap, fee });
      addTransaction({
        type: "income", amount: fee, date: now,
        category: `Visit · ${paymentMethod}`, patientId: patient.id,
      });
      const fu = new Date(`${followupDate}T${followupTime}:00`);
      await addAppointment({
        patientId: patient.id,
        date: fu.toISOString(),
        duration: 45,
        type: followupType,
        expectedFee: fee,
        recurring: null,
      });
      toast.success("Visit completed and saved");
      navigate({ to: "/app/patients/$id", params: { id: patient.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to finish visit");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <AppShell title="Visit Flow">
      <Container className="py-6 lg:py-8">
        {/* Stepper */}
        <div className="mb-6 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-1.5">
            {STEPS.map((s, i) => {
              const active = i === stepIdx;
              const done = i < stepIdx;
              const Icon = s.icon;
              return (
                <li key={s.id} className="flex items-center gap-1.5">
                  <button
                    onClick={() => goto(i)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active && "border-primary bg-primary text-primary-foreground shadow-soft",
                      done && !active && "border-success/40 bg-success/10 text-success",
                      !active && !done && "border-border bg-surface text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                      active ? "bg-primary-foreground/20" : done ? "bg-success/20" : "bg-muted",
                    )}>
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step body */}
        <div className="min-h-[420px] rounded-3xl border bg-surface p-5 shadow-card lg:p-7">
          {step.id === "start" && (
            <StartStep
              patients={patients}
              pid={pid}
              setPid={setPid}
              onBegin={() => {
                if (!pid) return toast.error("Select a patient to begin.");
                setVisitStartedAt(new Date().toISOString());
                toast.success("Visit started");
                next();
              }}
              startedAt={visitStartedAt}
            />
          )}

          {step.id === "summary" && patient && (
            <SummaryStep patient={patient} ageOf={ageOf} latestAssessment={latestAssessment} />
          )}

          {step.id === "assessment" && patient && (
            <FootAssessmentModule
              patientName={patient.name}
              patientMeta={`${patient.diabetesStatus !== "none" ? patient.diabetesStatus.toUpperCase() + " · " : ""}${observations.length} observation${observations.length === 1 ? "" : "s"}`}
              observations={observations}
              onSave={(o) => setObservations((prev) => [o, ...prev])}
            />
          )}

          {step.id === "photos" && (
            <PhotosStep photos={photos} onAdd={addPhotoFile} onRemove={(id) => setPhotos((p) => p.filter((x) => x.id !== id))} onNote={(id, note) => setPhotos((p) => p.map((x) => x.id === id ? { ...x, note } : x))} />
          )}

          {step.id === "dictation" && (
            <DictationStep value={dictation} onChange={setDictation} observations={observations} />
          )}

          {step.id === "soap" && (
            <SoapStep
              soap={soap}
              setSoap={setSoap}
              loading={soapLoading}
              onGenerate={generateSoap}
              hasContext={!!dictation.trim() || observations.length > 0}
            />
          )}

          {step.id === "billing" && (
            <BillingStep fee={fee} setFee={setFee} method={paymentMethod} setMethod={setPaymentMethod} />
          )}

          {step.id === "education" && (
            <EducationStep selected={selectedTopics} toggle={(id) => setSelectedTopics((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])} />
          )}

          {step.id === "followup" && (
            <FollowupStep
              date={followupDate} setDate={setFollowupDate}
              time={followupTime} setTime={setFollowupTime}
              type={followupType} setType={setFollowupType}
            />
          )}

          {step.id === "finish" && patient && (
            <FinishStep
              patient={patient}
              observations={observations.length}
              photos={photos.length}
              soap={!!soap}
              fee={fee}
              followup={`${format(new Date(`${followupDate}T${followupTime}:00`), "EEE, MMM d · HH:mm")}`}
              startedAt={visitStartedAt}
              education={selectedTopics.length}
              onFinish={finishVisit}
              finishing={finishing}
            />
          )}
        </div>

        {/* Nav */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={prev} disabled={stepIdx === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div className="text-xs text-muted-foreground">
            Step {stepIdx + 1} of {STEPS.length}
          </div>
          {step.id !== "finish" ? (
            <Button
              onClick={next}
              disabled={!canAdvance}
              className="gradient-primary text-primary-foreground"
            >
              {step.id === "start" && !visitStartedAt ? "Skip" : "Next"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Link to="/app/dashboard" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Cancel & exit
            </Link>
          )}
        </div>
      </Container>
    </AppShell>
  );
}

/* ─────────── Step components ─────────── */

function StartStep({ patients, pid, setPid, onBegin, startedAt }: {
  patients: { id: string; name: string; diabetesStatus: string }[];
  pid: string; setPid: (v: string) => void;
  onBegin: () => void; startedAt: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-card">
        <Play className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Start a new visit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Guided workflow from patient check-in through follow-up scheduling.
        </p>
      </div>
      <div className="space-y-2 text-left">
        <Label>Patient</Label>
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}{p.diabetesStatus !== "none" ? ` · ${p.diabetesStatus.toUpperCase()}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="lg" onClick={onBegin} className="w-full gradient-primary text-primary-foreground">
        <Play className="mr-2 h-4 w-4" /> Begin visit
      </Button>
      {startedAt && (
        <div className="text-xs text-success">
          Visit in progress since {format(new Date(startedAt), "HH:mm")}
        </div>
      )}
    </div>
  );
}

function SummaryStep({ patient, ageOf, latestAssessment }: any) {
  const age = ageOf(patient.dob);
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Patient summary</div>
        <h2 className="mt-1 text-2xl font-bold">{patient.name}</h2>
        <p className="text-sm text-muted-foreground">
          {age ? `${age} yrs · ` : ""}{patient.phone}{patient.email ? ` · ${patient.email}` : ""}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Diabetes status" value={patient.diabetesStatus === "none" ? "None" : patient.diabetesStatus.toUpperCase()} />
        <InfoCard label="Allergies" value={patient.allergies || "None on record"} />
        <InfoCard label="Conditions" value={patient.conditions?.length ? patient.conditions.join(", ") : "—"} />
        <InfoCard label="Address" value={patient.address || "—"} />
      </div>
      {patient.notes && (
        <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Nursing notes</div>
          {patient.notes}
        </div>
      )}
      {latestAssessment && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-primary">Latest foot assessment</div>
          {summarizeAssessment(latestAssessment)}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function PhotosStep({ photos, onAdd, onRemove, onNote }: {
  photos: { id: string; url: string; note: string }[];
  onAdd: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Clinical photos</h2>
          <p className="text-sm text-muted-foreground">Capture wound sites, calluses, or overall foot condition.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90">
          <Camera className="h-4 w-4" /> Add photo
          <input type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onAdd(e.target.files)} />
        </label>
      </div>
      {photos.length === 0 ? (
        <label className="grid h-56 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground hover:bg-muted/50">
          <div>
            <ImageIcon className="mx-auto h-8 w-8 opacity-60" />
            <div className="mt-2">Tap to add clinical photos</div>
          </div>
          <input type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onAdd(e.target.files)} />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border bg-background shadow-soft">
              <div className="relative aspect-square bg-muted">
                <img src={p.url} alt="Clinical" className="h-full w-full object-cover" />
                <button
                  onClick={() => onRemove(p.id)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                value={p.note}
                onChange={(e) => onNote(p.id, e.target.value)}
                placeholder="Caption / location"
                className="rounded-none border-0 border-t"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DictationStep({ value, onChange, observations }: {
  value: string; onChange: (v: string) => void; observations: FootObservation[];
}) {
  const [recording, setRecording] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Voice dictation</h2>
        <p className="text-sm text-muted-foreground">Speak or type visit notes. These feed the AI SOAP note in the next step.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => { setRecording((r) => !r); toast.info(recording ? "Recording stopped" : "Recording…"); }}
          className={cn("gap-2", recording ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}
        >
          <Mic className={cn("h-4 w-4", recording && "animate-pulse")} />
          {recording ? "Stop" : "Start dictation"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {observations.length} finding{observations.length === 1 ? "" : "s"} from foot assessment will be included.
        </span>
      </div>
      <Textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Patient presents for routine diabetic foot care. Trimmed nails, debrided callus over left 1st MTH. No signs of infection…"
      />
    </div>
  );
}

function SoapStep({ soap, setSoap, loading, onGenerate, hasContext }: {
  soap: { s: string; o: string; a: string; p: string } | null;
  setSoap: (s: any) => void;
  loading: boolean; onGenerate: () => void; hasContext: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">AI SOAP note</h2>
          <p className="text-sm text-muted-foreground">Generated from assessment findings, photos context, and dictation.</p>
        </div>
        <Button onClick={onGenerate} disabled={loading} className="gradient-primary text-primary-foreground">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />{soap ? "Regenerate" : "Generate"}</>}
        </Button>
      </div>
      {!hasContext && !soap && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
          Tip: complete the foot assessment or dictation first for a richer draft.
        </div>
      )}
      {!soap ? (
        <div className="grid h-64 place-items-center rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
          Click Generate to draft the SOAP note.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {(["s","o","a","p"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="uppercase">{k === "s" ? "Subjective" : k === "o" ? "Objective" : k === "a" ? "Assessment" : "Plan"}</Label>
              <Textarea rows={5} value={soap[k]} onChange={(e) => setSoap({ ...soap, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BillingStep({ fee, setFee, method, setMethod }: {
  fee: number; setFee: (n: number) => void; method: string; setMethod: (v: string) => void;
}) {
  const presets = [50, 75, 100, 125, 150];
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h2 className="text-lg font-bold">Billing</h2>
        <p className="text-sm text-muted-foreground">Record the visit fee — logged to your income ledger on finish.</p>
      </div>
      <div className="rounded-2xl border bg-background p-5 shadow-soft">
        <Label>Visit fee</Label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-muted-foreground">$</span>
          <Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} className="h-12 text-2xl font-bold" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setFee(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                fee === p ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >${p}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Payment method</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="etransfer">E-transfer</SelectItem>
            <SelectItem value="insurance">Insurance / claim</SelectItem>
            <SelectItem value="invoice">Send invoice</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EducationStep({ selected, toggle }: { selected: string[]; toggle: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Patient education</h2>
        <p className="text-sm text-muted-foreground">Select topics to include in the take-home handout.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {EDUCATION_TOPICS.map((t) => {
          const active = selected.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                active ? "border-primary bg-primary/5 shadow-soft" : "hover:bg-muted/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm">{t.title}</div>
                <div className={cn(
                  "grid h-5 w-5 place-items-center rounded-full border",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}>
                  {active && <Check className="h-3 w-3" />}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FollowupStep({ date, setDate, time, setTime, type, setType }: any) {
  const quick = [
    { label: "1 week",   d: 7  },
    { label: "2 weeks",  d: 14 },
    { label: "4 weeks",  d: 28 },
    { label: "6 weeks",  d: 42 },
    { label: "3 months", d: 90 },
  ];
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h2 className="text-lg font-bold">Schedule follow-up</h2>
        <p className="text-sm text-muted-foreground">Create the next appointment automatically on finish.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q.label}
            onClick={() => setDate(format(addDays(new Date(), q.d), "yyyy-MM-dd"))}
            className="rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted"
          >{q.label}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Visit type</Label>
        <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Foot care follow-up" />
      </div>
    </div>
  );
}

function FinishStep({ patient, observations, photos, soap, fee, followup, startedAt, education, onFinish, finishing }: any) {
  const rows = [
    { k: "Patient", v: patient.name },
    { k: "Started", v: startedAt ? format(new Date(startedAt), "HH:mm") : "—" },
    { k: "Findings recorded", v: `${observations}` },
    { k: "Photos captured", v: `${photos}` },
    { k: "SOAP note", v: soap ? "Ready" : "Missing" },
    { k: "Fee", v: `$${fee}` },
    { k: "Education topics", v: `${education}` },
    { k: "Follow-up", v: followup },
  ];
  return (
    <div className="mx-auto max-w-lg space-y-5 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Ready to finish</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review the summary and save the visit.</p>
      </div>
      <div className="rounded-2xl border bg-background text-left shadow-soft">
        {rows.map((r, i) => (
          <div key={r.k} className={cn("flex items-center justify-between px-4 py-3", i < rows.length - 1 && "border-b")}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{r.k}</span>
            <span className="text-sm font-medium">{r.v}</span>
          </div>
        ))}
      </div>
      <Button
        size="lg"
        disabled={!soap || finishing}
        onClick={onFinish}
        className="w-full gradient-primary text-primary-foreground"
      >
        {finishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Finish & save visit</>}
      </Button>
      {!soap && <p className="text-xs text-warning">Generate a SOAP note before finishing.</p>}
    </div>
  );
}
