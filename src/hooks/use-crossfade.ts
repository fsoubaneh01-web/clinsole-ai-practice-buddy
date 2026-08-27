import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Drives a hold-then-dissolve sequence over `count` frames.
 *
 * Shared by every crossfading surface on the marketing page so they all obey
 * the same rules: nothing advances off-screen, nothing advances in a hidden
 * tab, and prefers-reduced-motion settles on the first frame rather than
 * cutting between them.
 */
export function useCrossfade(count: number, holdMs = 8000) {
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

  const animating = !reducedMotion && inView && pageVisible && count > 1;

  useEffect(() => {
    if (!animating) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, holdMs);
    return () => window.clearInterval(timer);
  }, [animating, holdMs, count]);

  return { ref, index: reducedMotion ? 0 : index, reducedMotion, animating };
}
