import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { SceneImage } from "@/components/landing/SceneImage";
import type { Scene } from "@/lib/landing-media";

/**
 * Full-bleed band with a slowly panning backdrop. The imagery moves; the
 * heading and the call to action do not — they sit on an opaque scrim at a
 * fixed position, because a button that drifts is a button that gets missed.
 */
export function SupportBand({
  scene,
  eyebrow,
  title,
  body,
  children,
}: {
  scene: Scene;
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: false,
    threshold: 0,
    rootMargin: "0px",
  });

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="clin-pan absolute -inset-[8%]"
          style={{ animationPlayState: inView ? "running" : "paused" }}
        >
          <SceneImage scene={scene} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-slate-950/35" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="max-w-xl text-white">
          <div className="text-xs font-semibold tracking-widest text-white/70 uppercase">
            {eyebrow}
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 lg:text-base">{body}</p>
          <div className="mt-7 flex flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
