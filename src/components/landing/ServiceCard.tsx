import type { LucideIcon } from "lucide-react";
import { SceneImage } from "@/components/landing/SceneImage";
import type { Scene } from "@/lib/landing-media";

/**
 * A feature tile. On hover the image lifts a few percent and shifts, the card
 * rises 3px and the icon nudges — three small moves on the same 380–440ms
 * curve, so they land together as one gesture.
 *
 * `focus-within` mirrors the hover state, which is what makes the same motion
 * reachable from the keyboard.
 */
export function ServiceCard({
  icon: Icon,
  title,
  description,
  scene,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  scene: Scene;
}) {
  return (
    <article className="clin-card group h-full overflow-hidden rounded-3xl border bg-surface shadow-soft hover:shadow-card">
      <div className="relative h-40 overflow-hidden">
        <div className="clin-media absolute inset-0">
          <div className="h-full w-full">
            <SceneImage scene={scene} />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
        <div className="clin-nudge absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-xl bg-surface/95 text-primary shadow-soft backdrop-blur">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}
