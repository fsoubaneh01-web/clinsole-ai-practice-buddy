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
import { Switch } from "@/components/ui/switch";
import { FootAssessmentModule } from "@/components/FootAssessmentModule";
import { preparePhoto } from "@/lib/image-compress";
import { useStore, summarizeAssessment } from "@/lib/store";
import { generateSoapNote } from "@/lib/soap.functions";
import { useServerFn } from "@tanstack/react-start";
import { useDictation } from "@/hooks/use-dictation";
import { cn } from "@/lib/utils";
import { checkAppointmentOverlap } from "@/lib/appointments.functions";
import { parseLocalDateTime } from "@/lib/datetime";
import { RiskBadge } from "@/components/RiskBadge";
import { computeRisk, visitAssessments } from "@/lib/risk-score";
import { ReferralFlagCard } from "@/components/ReferralFlag";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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

const PENDING_CAPTURE_KEY = "clinsole:pending-capture";

function VisitFlow() {
  const { patientId } = Route.useSearch();
  const navigate = useNavigate();
  const {
    patients, nurse, ageOf, latestAssessmentFor, footAssessments, uploadClinicalPhotos,
    addTreatment, addTransaction, addAppointment, saveVisitPhotos,
  } = useStore();
  const generate = useServerFn(generateSoapNote);
  const checkOverlap = useServerFn(checkAppointmentOverlap);

  const [stepIdx, setStepIdx] = useState(0);
  const [pid, setPid] = useState(patientId || patients[0]?.id || "");
  const [photos, setPhotos] = useState<{ id: string; url: string; path?: string; uploading?: boolean; note: string }[]>([]);
  const [dictation, setDictation] = useState("");
  const [soap, setSoap] = useState<{ s: string; o: string; a: string; p: string } | null>(null);
  const [soapLoading, setSoapLoading] = useState(false);
  const [fee, setFee] = useState(75);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["daily-inspect", "footwear"]);
  const [followupDate, setFollowupDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [followupTime, setFollowupTime] = useState("10:00");
  const [followupType, setFollowupType] = useState("Foot care follow-up");
  const [skipFollowup, setSkipFollowup] = useState(false);
  const [visitStartedAt, setVisitStartedAt] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [followupConflict, setFollowupConflict] = useState<{ date: string; patientName?: string | null } | null>(null);

  // iOS can evict/reload the web view while the native camera is open, which would
  // otherwise wipe already-uploaded photos from this step. Persist per patient.
  const photoKey = pid ? `clinsole:visit-photos:${pid}` : null;
  useEffect(() => {
    if (!photoKey) return;
    try {
      const raw = sessionStorage.getItem(photoKey);
      if (raw) setPhotos(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [photoKey]);
  useEffect(() => {
    if (!photoKey) return;
    try {
      const done = photos.filter((p) => p.path).map(({ id, url, path, note }) => ({ id, url, path, note }));
      if (done.length) sessionStorage.setItem(photoKey, JSON.stringify(done));
      else sessionStorage.removeItem(photoKey);
    } catch { /* quota — ignore */ }
  }, [photoKey, photos]);

  // ONE shared file input for every "add photo" affordance. No `capture` attribute:
  // forcing the iOS full-screen camera lets the OS evict the web view, and the file
  // is silently lost on return.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openPhotoPicker = (multiple: boolean) => {
    const el = fileInputRef.current;
    if (!el) return;
    el.multiple = multiple;
    try {
      sessionStorage.setItem(PENDING_CAPTURE_KEY, JSON.stringify({ pendingCapture: true, stepIndex: stepIdx }));
    } catch { /* ignore */ }
    el.click();
  };
  // If the web view was torn down mid-capture, the flag survives but no file arrived.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_CAPTURE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_CAPTURE_KEY);
      if (JSON.parse(raw)?.pendingCapture) toast.error("Photo capture interrupted, please try again");
    } catch { /* ignore */ }
  }, []);



  const observations = useMemo(
    () => footAssessments.filter(
      (a) => a.region && a.patientId === pid && (!visitStartedAt || a.date >= visitStartedAt),
    ),
    [footAssessments, pid, visitStartedAt],
  );

  const step = STEPS[stepIdx];
  const patient = patients.find((p) => p.id === pid);
  const latestAssessment = pid ? latestAssessmentFor(pid) : undefined;
  const visitFindings = useMemo(
    () => (patient ? visitAssessments(footAssessments, patient.id) : []),
    [footAssessments, patient],
  );
  const visitRisk = useMemo(
    () => (patient ? computeRisk(visitFindings, patient) : null),
    [visitFindings, patient],
  );

  // Auto-save draft per patient so nurses can move back/forward and resume.
  const draftKey = pid ? `clinsole-visit-draft-${pid}` : null;
  const hydrated = useRef(false);
  useEffect(() => {
    if (!draftKey || hydrated.current) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.stepIdx != null) setStepIdx(d.stepIdx);
        if (d.dictation) setDictation(d.dictation);
        if (d.soap) setSoap(d.soap);
        if (d.fee) setFee(d.fee);
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
        if (d.selectedTopics) setSelectedTopics(d.selectedTopics);
        if (d.followupDate) setFollowupDate(d.followupDate);
        if (d.followupTime) setFollowupTime(d.followupTime);
        if (d.followupType) setFollowupType(d.followupType);
        if (d.visitStartedAt) setVisitStartedAt(d.visitStartedAt);
        toast.info("Resumed visit draft");
      }
    } catch {}
    hydrated.current = true;
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !hydrated.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        stepIdx, dictation, soap, fee, paymentMethod,
        selectedTopics, followupDate, followupTime, followupType, visitStartedAt,
      }));
    } catch {}
  }, [draftKey, stepIdx, dictation, soap, fee, paymentMethod,
      selectedTopics, followupDate, followupTime, followupType, visitStartedAt]);

  const progressPct = Math.round((stepIdx / (STEPS.length - 1)) * 100);

  const canAdvance = useMemo(() => {
    if (step.id === "start") return !!pid;
    if (step.id === "soap") return !!soap;
    return true;
  }, [step.id, pid, soap]);

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));
  const goto = (i: number) => setStepIdx(i);

  const printSummary = () => {
    if (!patient) return;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return toast.error("Enable pop-ups to print the summary.");
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    const obsRows = observations.map((o) =>
      `<tr><td>${o.side === "L" ? "Left" : "Right"} ${esc(o.regionLabel ?? "Region")}</td><td>${esc(o.notes || "—")}</td><td>${o.pain || "—"}</td></tr>`
    ).join("") || `<tr><td colspan="3" style="color:#888">No findings recorded</td></tr>`;
    const edu = EDUCATION_TOPICS.filter((t) => selectedTopics.includes(t.id))
      .map((t) => `<li><strong>${esc(t.title)}</strong> — ${esc(t.body)}</li>`).join("");
    const soapBlock = soap ? `
      <h3>SOAP Note</h3>
      <p><strong>Subjective:</strong> ${esc(soap.s)}</p>
      <p><strong>Objective:</strong> ${esc(soap.o)}</p>
      <p><strong>Assessment:</strong> ${esc(soap.a)}</p>
      <p><strong>Plan:</strong> ${esc(soap.p)}</p>` : "";
    const fuParsed = parseLocalDateTime(followupDate, followupTime);
    const fu = fuParsed ? format(fuParsed, "EEE, MMM d yyyy · HH:mm") : "Not scheduled";

    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Visit Summary — ${esc(patient.name)}</title>
      <style>
        body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;max-width:780px;margin:32px auto;padding:0 24px}
        h1{font-size:22px;margin:0 0 4px} h2{font-size:16px;margin:24px 0 8px;padding-bottom:4px;border-bottom:1px solid #ddd}
        h3{font-size:14px;margin:16px 0 6px} .meta{color:#666;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;margin:8px 0} td,th{text-align:left;padding:6px 8px;border-bottom:1px solid #eee;font-size:13px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px}
        .grid div span{color:#666;display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
        ul{padding-left:20px} .brand{color:#6C4CF1;font-weight:700}
        @media print{body{margin:0}}
      </style></head><body>
      <div class="brand">ClinSole AI · Visit Summary</div>
      <h1>${esc(patient.name)}</h1>
      <div class="meta">${patient.dob ? `${ageOf(patient.dob)} yrs · ` : ""}${esc(patient.phone || "")}${nurse?.name ? ` · Nurse: ${esc(nurse.name)}` : ""}</div>
      <h2>Visit</h2>
      <div class="grid">
        <div><span>Started</span>${visitStartedAt ? format(new Date(visitStartedAt), "EEE, MMM d · HH:mm") : "—"}</div>
        <div><span>Completed</span>${format(new Date(), "EEE, MMM d · HH:mm")}</div>
        <div><span>Diabetes</span>${patient.diabetesStatus === "none" ? "None" : patient.diabetesStatus.toUpperCase()}</div>
        <div><span>Allergies</span>${esc(patient.allergies || "None on record")}</div>
        <div><span>Fee</span>$${fee} (${esc(paymentMethod)})</div>
        <div><span>Follow-up</span>${esc(followupType)} — ${fu}</div>
      </div>
      <h2>Foot Assessment Findings</h2>
      <table><thead><tr><th>Region</th><th>Notes</th><th>Pain</th></tr></thead><tbody>${obsRows}</tbody></table>
      <h2>Voice Dictation</h2>
      <p>${esc(dictation) || '<span style="color:#888">No dictation recorded</span>'}</p>
      <h2>Clinical Photos</h2>
      <p>${photos.length} photo${photos.length === 1 ? "" : "s"} captured during visit.</p>
      ${soapBlock ? `<h2>Clinical Note</h2>${soapBlock}` : ""}
      ${edu ? `<h2>Patient Education Provided</h2><ul>${edu}</ul>` : ""}
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };


  const addPhotoFile = async (files: FileList | null) => {
    // Snapshot synchronously: on iOS the FileList can be detached after an await.
    const list = files ? Array.from(files) : [];
    console.info("[photo] input change", { count: list.length, types: list.map((f) => `${f.type || "?"}/${Math.round(f.size / 1024)}KB`) });
    try { sessionStorage.removeItem(PENDING_CAPTURE_KEY); } catch { /* ignore */ }
    if (list.length === 0) {
      toast.error("No photo came back from the camera. Try again, or use “Choose from library”.");
      return;
    }
    if (!pid) { toast.error("Select a patient first."); return; }
    // Compress + upload every selected photo in parallel; thumbnails are
    // self-contained data URLs so they survive re-renders and re-decodes.
    await Promise.all(
      list.map(async (f) => {
        const id = (crypto.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        let thumbnail = "";
        try {
          const prepared = await preparePhoto(f);
          thumbnail = prepared.thumbnail;
          if (import.meta.env.DEV) console.info("[photo] prepared", { id, from: f.size, to: prepared.file.size });
          setPhotos((p) => [{ id, url: thumbnail, note: "", uploading: true }, ...p]);
          const res = await uploadClinicalPhotos(pid, [prepared.file]);
          if (res.error || !res.paths?.[0]) throw new Error(res.error || "Photo upload failed.");
          if (import.meta.env.DEV) console.info("[photo] uploaded", { id, path: res.paths[0] });
          setPhotos((p) => p.map((x) => (x.id === id ? { ...x, uploading: false, path: res.paths![0] } : x)));
        } catch (e: any) {
          console.error("[photo] failed", e);
          toast.error(e?.message || "Photo upload failed.");
          if (thumbnail.startsWith("blob:")) URL.revokeObjectURL(thumbnail);
          setPhotos((p) => p.filter((x) => x.id !== id));
        }
      }),
    );
  };


  const generateSoap = async () => {
    if (!patient) return toast.error("Select a patient first.");
    setSoapLoading(true);
    try {
      const age = ageOf(patient.dob);
      const obsSummary = observations
        .slice(0, 6)
        .map((o) => `${o.side === "L" ? "Left" : "Right"} ${o.regionLabel ?? "Region"}: ${o.notes || "noted"}${o.pain ? ` · pain ${o.pain}` : ""}`)
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

  const finishVisit = async (opts?: { forceFollowup?: boolean; dropFollowup?: boolean }) => {
    if (!patient || !soap) return;

    const wantsFollowup = !skipFollowup && !opts?.dropFollowup;
    // Local wall-clock interpretation, converted to a UTC instant on save.
    const fuDate = wantsFollowup ? parseLocalDateTime(followupDate, followupTime) : null;
    const fuValid = !!fuDate && !isNaN(fuDate.getTime());


    // Authoritative server-side double-booking check before anything is saved.
    if (fuValid && !opts?.forceFollowup) {
      try {
        const res = await checkOverlap({
          data: { startIso: fuDate!.toISOString(), durationMin: 45 },
        });
        if (res.conflict) { setFollowupConflict(res.conflict); return; }
      } catch (e) {
        console.error("follow-up overlap check", e);
      }
    }

    setFinishing(true);
    try {
      const now = new Date().toISOString();
      const treatmentRes = await addTreatment(patient.id, { date: now, soap, fee });
      if (treatmentRes.error) throw new Error(treatmentRes.error);
      await addTransaction({
        type: "income", amount: fee, date: now,
        category: `Visit · ${paymentMethod}`, patientId: patient.id,
      });

      // Only schedule a follow-up when the nurse hasn't skipped it and both date/time are valid.
      if (wantsFollowup) {
        if (fuValid) {
          await addAppointment({
            patientId: patient.id,
            date: fuDate!.toISOString(),
            duration: 45,
            type: followupType,
            expectedFee: fee,
            recurring: null,
          });
        } else if (followupDate && followupTime) {
          toast.warning("Follow-up date/time was invalid; skipping appointment.");
        } else {
          toast.warning("Follow-up date/time missing; appointment not scheduled.");
        }
      }

      // Link the uploaded clinical photos to the treatment so they're recoverable later.
      const uploaded = photos.filter((p) => p.path);
      if (treatmentRes.treatment && uploaded.length) {
        const stepIndex = STEPS.findIndex((s) => s.id === "photos");
        const res = await saveVisitPhotos(
          treatmentRes.treatment.id,
          patient.id,
          uploaded.map((p) => ({ path: p.path!, caption: p.note, stepIndex })),
        );
        if (res.error) toast.warning("Visit saved, but photos could not be attached to the record.");
        else { setPhotos([]); if (photoKey) try { sessionStorage.removeItem(photoKey); } catch {} }
      }

      if (draftKey) try { localStorage.removeItem(draftKey); } catch {}
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
        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">{step.label}</span>
            <span className="text-muted-foreground">Step {stepIdx + 1} of {STEPS.length} · {progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

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
            <SummaryStep patient={patient} ageOf={ageOf} latestAssessment={latestAssessment} risk={visitRisk} visitFindings={visitFindings} />
          )}

          {step.id === "assessment" && patient && (
            <FootAssessmentModule
              patientId={pid}
              patientName={patient.name}
              patientMeta={`${patient.diabetesStatus !== "none" ? patient.diabetesStatus.toUpperCase() + " · " : ""}${observations.length} observation${observations.length === 1 ? "" : "s"}`}
            />
          )}

          {step.id === "photos" && (
            <PhotosStep photos={photos} onPick={openPhotoPicker} onRemove={(id) => setPhotos((p) => p.filter((x) => x.id !== id))} onNote={(id, note) => setPhotos((p) => p.map((x) => x.id === id ? { ...x, note } : x))} />
          )}

          {step.id === "dictation" && (
            <DictationStep value={dictation} onChange={setDictation} observations={observations} visitId={pid ? `${pid}:${visitStartedAt ?? ""}` : undefined} />
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
              skip={skipFollowup} setSkip={setSkipFollowup}
            />
          )}

          {step.id === "finish" && patient && (
            <FinishStep
              patient={patient}
              observations={observations.length}
              photos={photos.length}
              soap={!!soap}
              fee={fee}
              followup={skipFollowup ? "Skipped" : (() => { const d = parseLocalDateTime(followupDate, followupTime); return d ? format(d, "EEE, MMM d · HH:mm") : "Not scheduled"; })()}
              startedAt={visitStartedAt}
              education={selectedTopics.length}
              onFinish={() => { void finishVisit(); }}
              onPrint={printSummary}
              finishing={finishing}
            />
          )}

        </div>

        <AlertDialog open={!!followupConflict} onOpenChange={(o) => { if (!o) setFollowupConflict(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Double-booking warning</AlertDialogTitle>
              <AlertDialogDescription>
                {followupConflict && `The follow-up overlaps with an existing appointment at ${format(new Date(followupConflict.date), "HH:mm")}${followupConflict.patientName ? ` (${followupConflict.patientName})` : ""}. Book it anyway?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setFollowupConflict(null); void finishVisit({ dropFollowup: true }); }}
              >Finish without follow-up</AlertDialogAction>
              <AlertDialogAction
                onClick={() => { setFollowupConflict(null); void finishVisit({ forceFollowup: true }); }}
              >Book anyway</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

function SummaryStep({ patient, ageOf, latestAssessment, risk, visitFindings }: any) {
  const age = ageOf(patient.dob);
  return (
    <div className="space-y-5">
      {risk && <RiskBadge risk={risk} />}
      {risk?.hasData && visitFindings?.length > 0 && (
        <ReferralFlagCard patient={patient} assessments={visitFindings} risk={risk} />
      )}
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

function PhotosStep({ photos, onPick, onRemove, onNote }: {
  photos: { id: string; url: string; path?: string; uploading?: boolean; note: string }[];
  onPick: (multiple: boolean) => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
}) {
  // All affordances trigger the single shared input owned by VisitFlow.
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Clinical photos</h2>
          <p className="text-sm text-muted-foreground">Capture wound sites, calluses, or overall foot condition.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPick(false)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
          >
            <Camera className="h-4 w-4" /> Take photo
          </button>
          <button
            type="button"
            onClick={() => onPick(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-soft hover:bg-muted"
          >
            <ImageIcon className="h-4 w-4" /> Library
          </button>
        </div>
      </div>
      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => onPick(false)}
          className="grid h-56 w-full cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground hover:bg-muted/50"
        >
          <div>
            <ImageIcon className="mx-auto h-8 w-8 opacity-60" />
            <div className="mt-2">Tap to add clinical photos</div>
          </div>
        </button>


      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border bg-background shadow-soft">
              <div className="relative aspect-square bg-muted">
                <img src={p.url} alt="Clinical" className="h-full w-full object-cover" />
                {p.uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-1.5 text-xs font-medium text-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      Uploading…
                    </div>
                  </div>
                )}
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

function DictationStep({ value, onChange, observations, visitId }: {
  value: string; onChange: (v: string) => void; observations: { id: string }[]; visitId?: string;
}) {
  const { status, error, seconds, transcribeSeconds, supported, toggle, limitReached, limitMessage, usedMinutes, limitMinutes } =
    useDictation({
      visitId,
      onTranscript: (text) => {
        onChange(value ? `${value.trim()} ${text}` : text);
        toast.success("Transcript added");
      },
    });
  const recording = status === "recording";
  const busy = status === "transcribing" || status === "requesting";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Voice dictation</h2>
        <p className="text-sm text-muted-foreground">Speak or type visit notes. These feed the AI SOAP note in the next step.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={toggle}
          disabled={busy || !supported || limitReached}
          className={cn("gap-2", recording ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className={cn("h-4 w-4", recording && "animate-pulse")} />}
          {status === "transcribing" ? `Transcribing… ${transcribeSeconds}s`
            : status === "requesting" ? "Requesting mic…"
            : recording ? `Stop (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")})`
            : "Start dictation"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {observations.length} finding{observations.length === 1 ? "" : "s"} from foot assessment will be included.
        </span>
        <span className="text-xs text-muted-foreground">
          {usedMinutes.toFixed(1)} / {limitMinutes} min this month
        </span>
      </div>
      {status === "transcribing" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(95, 8 + transcribeSeconds * 6)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Transcribing with medical speech recognition — {transcribeSeconds}s elapsed. This usually takes 10–30 seconds.
          </p>
        </div>
      )}
      {limitMessage && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
          {limitMessage}
        </div>
      )}
      {error && !limitReached && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

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

function FollowupStep({ date, setDate, time, setTime, type, setType, skip, setSkip }: any) {
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
        <p className="text-sm text-muted-foreground">Create the next appointment automatically, or skip it for this visit.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-background p-4 shadow-soft">
        <div className="space-y-0.5">
          <Label htmlFor="skip-followup" className="text-sm font-semibold">Skip follow-up</Label>
          <p className="text-xs text-muted-foreground">No appointment will be scheduled.</p>
        </div>
        <Switch
          id="skip-followup"
          checked={skip}
          onCheckedChange={setSkip}
          aria-label="Skip follow-up"
        />
      </div>

      {!skip && (
        <div className="space-y-4 rounded-2xl border bg-surface p-4 transition-all">
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
      )}

      {skip && (
        <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">
          Follow-up appointment will not be scheduled for this visit.
        </div>
      )}
    </div>
  );
}

function FinishStep({ patient, observations, photos, soap, fee, followup, startedAt, education, onFinish, onPrint, finishing }: any) {
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          variant="outline"
          onClick={onPrint}
          className="w-full sm:w-auto"
        >
          <Printer className="mr-2 h-4 w-4" /> Print summary
        </Button>
        <Button
          size="lg"
          disabled={!soap || finishing}
          onClick={onFinish}
          className="w-full flex-1 gradient-primary text-primary-foreground"
        >
          {finishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Finish & save visit</>}
        </Button>
      </div>
      {!soap && <p className="text-xs text-warning">Generate a SOAP note before finishing.</p>}
    </div>
  );
}
