import type { CSSProperties } from "react";
import { useCrossfade } from "@/hooks/use-crossfade";
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
 * instead of resetting.
 */
export function ImageStage({ scenes, holdMs = 8000, className }: ImageStageProps) {
  const { ref, index, reducedMotion } = useCrossfade(scenes.length, holdMs);
  const activeScene = scenes[index] ?? scenes[0];

  return (
    <div
      ref={ref}
      role="img"
      aria-label={activeScene?.alt}
      data-motion={reducedMotion ? "off" : "on"}
      className={cn("clin-stage", className)}
    >
      {scenes.map((scene, i) => (
        <div key={scene.id} className="clin-stage__slide" data-active={i === index}>
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
