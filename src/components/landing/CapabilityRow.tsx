import { ArrowUpRight } from "lucide-react";

/**
 * Replaces the card: a hairline for separation and nothing else. On hover the
 * whole row drifts 3px toward its arrow and the rule warms up — the same
 * 380ms curve every other interactive element on the page uses.
 */
export function CapabilityRow({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article className="ivory-row border-t border-rule pt-6">
      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] tracking-[0.18em] text-ink-soft tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        <ArrowUpRight className="clin-nudge h-4 w-4 text-gold" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-[22px] font-normal tracking-[-0.02em] text-ink">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed font-extralight text-ink-muted">
        {description}
      </p>
    </article>
  );
}
