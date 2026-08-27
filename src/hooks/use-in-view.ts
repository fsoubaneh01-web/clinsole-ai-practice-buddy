import { useEffect, useRef, useState } from "react";

type Options = {
  /** Stop observing after the first intersection. Default: true. */
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
};

/**
 * Reports whether the referenced element is in the viewport. Used both to
 * trigger scroll reveals (once) and to keep off-screen autoplay idle (live).
 * Falls back to "visible" wherever IntersectionObserver is unavailable, so a
 * missing API never hides content.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = true,
  threshold = 0.12,
  rootMargin = "0px 0px -6% 0px",
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}
