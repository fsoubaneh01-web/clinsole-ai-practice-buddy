import { useEffect, useState, type CSSProperties } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneImage } from "@/components/landing/SceneImage";
import type { Scene } from "@/lib/landing-media";
import { cn } from "@/lib/utils";

const DRIFTS = ["a", "b", "c", "d"] as const;
/* Slightly different pan lengths per frame so the sequence never falls into
   a visible rhythm. */
const DRIFT_DURATIONS = ["27s", "31s", "29s", "33s"];

type ImageStageProps = {
  scenes: Scene[];
  /** How long each frame is held before the crossfade begins. */
  holdMs?: number;
  className?: string;
};

/**
 * A stack of images that crossfades slowly while each frame drifts and zooms.
 *
 * Three things keep it calm: the fade is long (2.4s, set in CSS), the drift is
 * continuous rather than triggered, and frames leaving the stage pause mid-pan
 * instead of resetting. It stops entirely off-screen, in a hidden tab, and
 * under prefers-reduced-motion — where it settles on the first frame.
 */
export function ImageStage({ scenes, holdMs = 8000, className }: ImageStageProps) {
  const reducedMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({
    once: false,
    threshold: 0,
    rootMargin: "0px",
  });
  const [pageVisible, setPageVisible] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => setPageVisible(document.visibilityState !== "hidden");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const animating = !reducedMotion && inView && pageVisible && scenes.length > 1;

  useEffect(() => {
    if (!animating) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % scenes.length);
    }, holdMs);
    return () => window.clearInterval(timer);
  }, [animating, holdMs, scenes.length]);

  /* Reduced motion holds the first frame rather than cutting between them —
     an instant swap would be more jarring than the movement it replaces. */
  const activeIndex = reducedMotion ? 0 : index;
  const activeScene = scenes[activeIndex] ?? scenes[0];

  return (
    <div
      ref={ref}
      role="img"
      aria-label={activeScene?.alt}
      data-motion={reducedMotion ? "off" : "on"}
      className={cn("clin-stage", className)}
    >
      {scenes.map((scene, i) => (
        <div key={scene.id} className="clin-stage__slide" data-active={i === activeIndex}>
          <div
            className="clin-stage__drift"
            data-drift={DRIFTS[i % DRIFTS.length]}
            style={
              { "--drift-duration": DRIFT_DURATIONS[i % DRIFT_DURATIONS.length] } as CSSProperties
            }
          >
            <SceneImage scene={scene} priority={i === 0} />
          </div>
        </div>
      ))}
    </div>
  );
}
