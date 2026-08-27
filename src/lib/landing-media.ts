import type { SceneArtKey, SceneTone } from "@/components/landing/SceneArt";

export type Scene = {
  id: string;
  /** Describes the frame — used as the image alt text and for assistive tech. */
  alt: string;
  /**
   * Optional photograph. Drop a URL or imported asset in here and the site
   * renders it instead of the built-in artwork; the motion treatment is
   * identical either way, so swapping in photography is a one-line change.
   */
  src?: string;
  art: SceneArtKey;
  /** Which palette the built-in artwork is drawn in. Defaults to "cool". */
  tone?: SceneTone;
};

/**
 * Section visuals, drawn in the warm palette so they read as paper on the
 * ivory ground rather than as dark panels dropped onto it.
 */
export const SECTION_SCENES = {
  capabilities: [
    {
      id: "sec-notes",
      alt: "A visit written up as a clinical note",
      art: "documentation",
      tone: "warm",
    },
    {
      id: "sec-assessment",
      alt: "A diabetic foot assessment in progress",
      art: "assessment",
      tone: "warm",
    },
  ],
  practices: [
    { id: "sec-round", alt: "A round of home visits under way", art: "home-visit", tone: "warm" },
    { id: "sec-week", alt: "The week's visits laid out", art: "care-plan", tone: "warm" },
  ],
} satisfies Record<string, Scene[]>;

export const PROFILE_SCENES = {
  mobile: {
    id: "pro-mobile",
    alt: "A nurse on the road between home visits",
    art: "home-visit",
    tone: "warm",
  },
  clinic: {
    id: "pro-clinic",
    alt: "A treatment chair in a foot care clinic",
    art: "assessment",
    tone: "warm",
  },
  residences: {
    id: "pro-residences",
    alt: "A round of visits inside a care residence",
    art: "care-plan",
    tone: "warm",
  },
} satisfies Record<string, Scene>;
