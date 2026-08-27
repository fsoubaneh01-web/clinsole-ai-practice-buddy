import { Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing-page lockup. Kept separate from the shared `Brand` component so the
 * signed-in app keeps its own purple mark untouched: here the glyph is the
 * only place gold appears as a fill outside a button.
 */
export function WordMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-ink">
        <Footprints className="h-4 w-4" />
      </span>
      <span className="text-[17px] tracking-[-0.02em] text-ink">
        ClinSole <span className="text-bronze">AI</span>
      </span>
    </div>
  );
}
