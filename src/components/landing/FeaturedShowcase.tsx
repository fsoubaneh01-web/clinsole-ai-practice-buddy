import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneImage } from "@/components/landing/SceneImage";
import { StatusDot } from "@/components/landing/ProfileCard";
import type { Scene } from "@/lib/landing-media";
import { cn } from "@/lib/utils";

export type ShowcaseItem = {
  id: string;
  role: string;
  setting: string;
  status: string;
  summary: string;
  highlights: string[];
  scene: Scene;
};

const ADVANCE_MS = 9000;

/**
 * Horizontal showcase that slides gently between profiles on its own and can
 * be driven by hand with the arrows or dots.
 *
 * Autoplay is the polite kind: it yields to a pointer or keyboard focus
 * anywhere inside, stops when the section scrolls away or the tab is hidden,
 * and never starts at all under prefers-reduced-motion — where the arrows and
 * dots still work and the track jumps without a transition.
 */
export function FeaturedShowcase({ items }: { items: ShowcaseItem[] }) {
  const reducedMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({
    once: false,
    threshold: 0.35,
    rootMargin: "0px",
  });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => setPageVisible(document.visibilityState !== "hidden");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const autoplaying = !reducedMotion && inView && pageVisible && !paused && items.length > 1;

  useEffect(() => {
    if (!autoplaying) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % items.length);
    }, ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [autoplaying, index, items.length]);

  const go = useCallback(
    (next: number) => {
      const total = items.length;
      setIndex(((next % total) + total) % total);
    },
    [items.length],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label="Practice profiles"
      className="relative"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="overflow-hidden border-y border-rule">
        <div
          className={cn("clin-track", reducedMotion && "transition-none")}
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` } as CSSProperties}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}: ${item.role}`}
              inert={i !== index}
              className="w-full shrink-0"
            >
              <div className="grid items-center gap-10 py-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16 lg:py-16">
                <div className="canvas-frame relative aspect-4/3 overflow-hidden md:aspect-square">
                  <div className="absolute inset-0">
                    <SceneImage scene={item.scene} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <StatusDot />
                    <span className="text-[11px] tracking-[0.16em] text-ink-soft uppercase">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="canvas-display-sm mt-5 text-[34px] lg:text-[44px]">{item.role}</h3>
                  <div className="mt-2 text-[15px] font-light text-ink-soft">{item.setting}</div>
                  <p className="mt-6 max-w-xl text-[17px] leading-relaxed font-extralight text-ink-muted">
                    {item.summary}
                  </p>
                  <ul className="mt-8 space-y-3">
                    {item.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-3 border-t border-rule pt-3 text-[15px] font-light text-ink"
                      >
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-signal" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announced only once the rotation has stopped, so autoplay never
          talks over the reader. */}
      <div className="sr-only" aria-live={autoplaying ? "off" : "polite"}>
        {`${index + 1} of ${items.length}: ${items[index]?.role ?? ""}`}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${item.role}`}
              aria-current={i === index}
              className={cn(
                "clin-dot h-2 rounded-full",
                i === index ? "w-8 bg-signal" : "w-2 bg-signal/30 hover:bg-signal/60",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ShowcaseButton label="Previous profile" onClick={() => go(index - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </ShowcaseButton>
          <ShowcaseButton label="Next profile" onClick={() => go(index + 1)}>
            <ChevronRight className="h-4 w-4" />
          </ShowcaseButton>
        </div>
      </div>
    </div>
  );
}

function ShowcaseButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-halo text-signal transition-[color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 hover:border-signal focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {children}
    </button>
  );
}
