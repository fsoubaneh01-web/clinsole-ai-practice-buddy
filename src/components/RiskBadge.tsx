import { format } from "date-fns";
import { Activity, AlertTriangle, Info, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, RISK_DISCLAIMER, type RiskResult } from "@/lib/risk-score";

const TONE = {
  low: { chip: "bg-success/15 text-success border-success/30", icon: ShieldCheck },
  moderate: { chip: "bg-warning/15 text-warning border-warning/30", icon: Activity },
  high: { chip: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
} as const;

/** Compact pill — for cards and list rows. */
export function RiskPill({ risk, className }: { risk: RiskResult; className?: string }) {
  const tone = TONE[risk.level];
  const Icon = tone.icon;
  return (
    <span
      title={`${CATEGORY_LABEL[risk.category]} — ${RISK_DISCLAIMER}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        tone.chip,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {risk.level} · Cat {risk.category}
    </span>
  );
}

/** Full card — for the patient dashboard header and the top of a visit summary. */
export function RiskBadge({ risk, className }: { risk: RiskResult; className?: string }) {
  const tone = TONE[risk.level];
  const Icon = tone.icon;
  return (
    <section
      className={cn("rounded-2xl border bg-surface p-4 shadow-soft", className)}
      aria-label="Documented foot risk stratification"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
            tone.chip,
          )}
        >
          <Icon className="h-4 w-4" />
          {risk.level} risk
        </span>
        <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {CATEGORY_LABEL[risk.category]}
        </span>
        {risk.visitDate && (
          <span className="text-[11px] text-muted-foreground">
            from {format(new Date(risk.visitDate), "MMM d, yyyy")} findings
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium">{risk.explanation}</p>

      {risk.reasons.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {risk.reasons.map((r) => (
            <li key={r} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {r}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        Documentation aid, not a diagnosis. {RISK_DISCLAIMER}
      </p>
    </section>
  );
}
