import { SceneImage } from "@/components/landing/SceneImage";
import type { Scene } from "@/lib/landing-media";

export type Profile = {
  id: string;
  role: string;
  setting: string;
  summary: string;
  status: string;
  scene: Scene;
};

/**
 * An illustrative practice profile. No container, no border, no shadow — the
 * image and the type sit directly on the page. Hover keeps the motion the rest
 * of the site uses: the image zooms a few percent inside its fixed frame while
 * everything around it stays put.
 */
export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="clin-card group">
      <div className="clin-media canvas-frame relative aspect-4/5 overflow-hidden">
        <div className="h-full w-full">
          <SceneImage scene={profile.scene} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <StatusDot />
        <span className="text-[11px] tracking-[0.16em] text-ink-soft uppercase">
          {profile.status}
        </span>
      </div>
      <h3 className="mt-4 text-[24px] font-normal tracking-[-0.025em] text-ink">{profile.role}</h3>
      <div className="mt-1 text-[14px] font-light text-ink-soft">{profile.setting}</div>
      <p className="mt-3 text-[15px] leading-relaxed font-extralight text-ink-muted">
        {profile.summary}
      </p>
    </article>
  );
}

export function StatusDot() {
  return (
    <span className="relative grid h-1.5 w-1.5 place-items-center">
      <span className="clin-halo absolute h-1.5 w-1.5 rounded-full bg-signal/50" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-signal" />
    </span>
  );
}
