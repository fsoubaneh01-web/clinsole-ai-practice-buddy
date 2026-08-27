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
      <div className="overflow-hidden rounded-3xl border bg-surface shadow-soft">
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
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-56 overflow-hidden md:min-h-full">
                  <div className="absolute inset-0">
                    <SceneImage scene={item.scene} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent md:bg-gradient-to-r" />
                </div>

                <div className="p-7 lg:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    <StatusDot />
                    {item.status}
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">{item.role}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">{item.setting}</div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {item.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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

      <div className="mt-5 flex items-center justify-between gap-4">
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
                i === index ? "w-7 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50",
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
      className="grid h-9 w-9 place-items-center rounded-full border bg-surface text-muted-foreground shadow-soft transition-[color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {children}
    </button>
  );
}
