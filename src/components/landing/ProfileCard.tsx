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
 * An illustrative practice profile. Same hover vocabulary as the service
 * tiles — image zoom, 3px lift — plus a status dot whose halo breathes on a
 * near-four-second cycle. Slow enough to register as presence rather than as
 * something demanding attention.
 */
export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="clin-card group h-full overflow-hidden rounded-3xl border bg-surface shadow-soft hover:shadow-card">
      <div className="relative aspect-4/5 overflow-hidden">
        <div className="clin-media absolute inset-0">
          <div className="h-full w-full">
            <SceneImage scene={profile.scene} />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />

        <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium shadow-soft backdrop-blur">
          <StatusDot />
          {profile.status}
        </div>

        <div className="absolute right-4 bottom-4 left-4 text-white">
          <div className="text-base font-semibold">{profile.role}</div>
          <div className="text-xs text-white/80">{profile.setting}</div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-muted-foreground">{profile.summary}</p>
      </div>
    </article>
  );
}

export function StatusDot() {
  return (
    <span className="relative grid h-2 w-2 place-items-center">
      <span className="clin-halo absolute h-2 w-2 rounded-full bg-success/50" />
      <span className="relative h-2 w-2 rounded-full bg-success" />
    </span>
  );
}
