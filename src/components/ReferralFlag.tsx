import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, Copy, FileText, Printer, Send, Undo2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useStore, type FootAssessment, type Patient } from "@/lib/store";
import { type RiskResult } from "@/lib/risk-score";
import {
  buildReferralSummary, evaluateReferral, loadFlagState, saveFlagState,
  REFERRAL_DISCLAIMER, type ManualFlagState,
} from "@/lib/referral";
import { cn } from "@/lib/utils";

type Props = {
  patient: Patient;
  assessments: FootAssessment[];
  risk: RiskResult;
  className?: string;
};

export function ReferralFlagCard({ patient, assessments, risk, className }: Props) {
  const { nurse, ageOf, getPhotoUrl } = useStore();
  const dayISO = assessments[0]?.date ?? new Date().toISOString();

  const auto = useMemo(() => evaluateReferral(assessments, risk, patient), [assessments, risk, patient]);
  const [state, setState] = useState<ManualFlagState>({});
  const [dismissing, setDismissing] = useState(false);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => { setState(loadFlagState(patient.id, dayISO)); }, [patient.id, dayISO]);

  const paths = useMemo(() => assessments.flatMap((a) => a.photoPaths), [assessments]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(paths.map((p) => getPhotoUrl(p))).then((urls) => {
      if (!cancelled) setPhotos(urls.filter((u): u is string => !!u));
    });
    return () => { cancelled = true; };
  }, [paths, getPhotoUrl]);

  const flag = state.manual
    ? { ...auto, flagged: true, criteria: [`Manually flagged by nurse: ${state.manual.note || "needs referral"}`, ...auto.criteria], headline: auto.flagged ? auto.headline : "This visit was manually flagged as needing referral." }
    : auto;

  const dismissed = !!state.dismissed;

  const summary = useMemo(
    () => buildReferralSummary({
      patient, age: ageOf(patient.dob), assessments, risk, flag,
      nurseName: nurse?.name, photoCount: photos.length,
    }),
    [patient, ageOf, assessments, risk, flag, nurse?.name, photos.length],
  );

  const persist = (next: ManualFlagState) => { setState(next); saveFlagState(patient.id, dayISO, next); };

  if (!flag.flagged && !state.manual) {
    return (
      <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed bg-surface p-3 text-xs text-muted-foreground", className)}>
        <span>No referral criteria met from documented findings.</span>
        <Button
          size="sm" variant="ghost" className="h-8 text-xs"
          onClick={() => persist({ ...state, manual: { note: "", at: new Date().toISOString() } })}
        >
          Flag as needs referral
        </Button>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border p-4 shadow-soft",
        dismissed ? "border-dashed bg-surface" : "border-warning/40 bg-warning/10",
        className,
      )}
      aria-label="Referral flag"
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", dismissed ? "bg-muted text-muted-foreground" : "bg-warning/25 text-warning")}>
          <Send className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("text-sm font-bold", dismissed && "text-muted-foreground line-through")}>{flag.headline}</h3>
            {!dismissed && flag.urgency === "prompt" && (
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Prompt</span>
            )}
          </div>

          <ul className="mt-2 space-y-1">
            {flag.criteria.map((c) => (
              <li key={c} className="text-xs text-foreground/80">• {c}</li>
            ))}
          </ul>

          {dismissed && (
            <p className="mt-2 rounded-xl bg-muted/60 p-2 text-[11px] text-muted-foreground">
              Dismissed {format(new Date(state.dismissed!.at), "MMM d, HH:mm")}
              {state.dismissed!.note ? ` — “${state.dismissed!.note}”` : " — no reason given"}
            </p>
          )}

          {dismissing ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional: why are you overriding this flag?"
                className="min-h-16 text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs" onClick={() => { persist({ ...state, dismissed: { note: note.trim(), at: new Date().toISOString() } }); setDismissing(false); setNote(""); }}>
                  <Check className="mr-1 h-3.5 w-3.5" />Save override
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setDismissing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="h-9 text-xs" onClick={() => setOpen(true)}>
                <FileText className="mr-1 h-4 w-4" />Generate referral summary
              </Button>
              {dismissed ? (
                <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => persist({ ...state, dismissed: undefined })}>
                  <Undo2 className="mr-1 h-4 w-4" />Restore flag
                </Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-9 text-xs" onClick={() => setDismissing(true)}>
                  <X className="mr-1 h-4 w-4" />Dismiss / override
                </Button>
              )}
            </div>
          )}

          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{REFERRAL_DISCLAIMER}</p>
        </div>
      </div>

      <ReferralSummaryDialog
        open={open}
        onOpenChange={setOpen}
        summary={summary}
        photos={photos}
        patientName={patient.name}
      />
    </section>
  );
}

function ReferralSummaryDialog({
  open, onOpenChange, summary, photos, patientName,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; summary: string; photos: string[]; patientName: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Referral summary copied");
    } catch {
      toast.error("Couldn't copy — select the text manually");
    }
  };

  const print = () => {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) { toast.error("Allow pop-ups to export the PDF"); return; }
    w.document.write(`<!doctype html><html><head><title>Referral · ${patientName}</title>
      <style>body{font:13px/1.55 ui-sans-serif,system-ui;padding:32px;color:#111}
      pre{white-space:pre-wrap;font:inherit}
      .imgs{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
      img{width:180px;height:180px;object-fit:cover;border:1px solid #ddd;border-radius:8px}</style>
      </head><body><pre>${summary.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}</pre>
      <div class="imgs">${photos.map((u) => `<img src="${u}" />`).join("")}</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto backdrop-blur-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Referral summary</DialogTitle>
          <DialogDescription>Compiled from this visit's documented findings — review before sending.</DialogDescription>
        </DialogHeader>

        <pre className="whitespace-pre-wrap rounded-xl border bg-muted/40 p-3 text-[11px] leading-relaxed">{summary}</pre>

        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((u, i) => (
              <img key={i} src={u} alt={`Visit photo ${i + 1}`} className="h-24 w-24 shrink-0 rounded-lg border object-cover" />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={copy}><Copy className="mr-1 h-4 w-4" />Copy text</Button>
          <Button size="sm" variant="outline" onClick={print}><Printer className="mr-1 h-4 w-4" />Export PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
