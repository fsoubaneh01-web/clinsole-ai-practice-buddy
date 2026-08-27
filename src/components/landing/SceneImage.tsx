import { SceneArt } from "@/components/landing/SceneArt";
import type { Scene } from "@/lib/landing-media";
import { cn } from "@/lib/utils";

/**
 * Renders a scene as a photograph when one is configured, and as the built-in
 * artwork otherwise. Both fill their container, so either can sit inside the
 * pan/zoom and hover-zoom wrappers without further adjustment.
 */
export function SceneImage({
  scene,
  className,
  priority = false,
}: {
  scene: Scene;
  className?: string;
  priority?: boolean;
}) {
  if (scene.src) {
    return (
      <img
        src={scene.src}
        alt={scene.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return <SceneArt scene={scene.art} tone={scene.tone} className={className} />;
}
