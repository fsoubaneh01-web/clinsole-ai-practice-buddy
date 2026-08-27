import type { SceneArtKey } from "@/components/landing/SceneArt";

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
};

/**
 * The hero sequence, crossfaded in order — arrive, assess, document, plan.
 * Each frame is held eight seconds and dissolves over a further 2.4.
 */
export const HERO_SCENES: Scene[] = [
  {
    id: "hero-arrival",
    alt: "A foot care nurse arriving for a home visit in late-afternoon light",
    art: "home-visit",
  },
  {
    id: "hero-assessment",
    alt: "A diabetic foot assessment in progress",
    art: "assessment",
  },
  {
    id: "hero-notes",
    alt: "Visit notes written up on a tablet straight after the appointment",
    art: "documentation",
  },
  {
    id: "hero-schedule",
    alt: "The week's visits laid out in the schedule",
    art: "care-plan",
  },
];

export const SERVICE_SCENES = {
  soap: { id: "svc-soap", alt: "A visit written up as a clinical note", art: "documentation" },
  patients: { id: "svc-patients", alt: "A patient record open mid-assessment", art: "assessment" },
  scheduling: { id: "svc-scheduling", alt: "A week of visits laid out", art: "care-plan" },
  income: { id: "svc-income", alt: "A month of visits and payments totalled up", art: "support" },
  assistant: {
    id: "svc-assistant",
    alt: "Follow-up wording drafted between visits",
    art: "home-visit",
  },
  privacy: { id: "svc-privacy", alt: "Patient data held securely", art: "documentation" },
} satisfies Record<string, Scene>;

export const PROFILE_SCENES = {
  mobile: { id: "pro-mobile", alt: "A nurse on the road between home visits", art: "home-visit" },
  clinic: { id: "pro-clinic", alt: "A treatment chair in a foot care clinic", art: "assessment" },
  residences: {
    id: "pro-residences",
    alt: "A round of visits inside a care residence",
    art: "care-plan",
  },
} satisfies Record<string, Scene>;

export const SUPPORT_SCENE: Scene = {
  id: "support",
  alt: "A practice light still on at the end of the day",
  art: "support",
};
