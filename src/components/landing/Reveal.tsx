import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger offset in ms. Keep the steps small — 60–110ms reads as one gesture. */
  delay?: number;
  /** "rise" fades and lifts copy; "media" resolves an image out of a soft blur. */
  variant?: "rise" | "media";
};

/**
 * Fades its children in as they enter the viewport. The hidden state lives in
 * CSS (`.clin-reveal`), which is also where prefers-reduced-motion cancels it,
 * so a reduced-motion visitor sees the finished state immediately.
 */
export function Reveal({ children, className, delay = 0, variant = "rise" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-revealed={inView}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={cn(variant === "media" ? "clin-reveal-media" : "clin-reveal", className)}
    >
      {children}
    </div>
  );
}
