import { useId } from "react";
import { cn } from "@/lib/utils";

export type SceneArtKey = "home-visit" | "assessment" | "documentation" | "care-plan" | "support";

export type SceneTone = "cool" | "warm" | "night";

type Palette = {
  from: string;
  to: string;
  light: string;
  accent: string;
  /** Colour the compositions darken with. */
  shade: string;
  /** Scales every shading opacity — warm scenes sit on ivory and need far less. */
  depth: number;
};

const PALETTES: Record<SceneTone, Record<SceneArtKey, Palette>> = {
  cool: {
    "home-visit": {
      from: "#2A1B63",
      to: "#5B3FD6",
      light: "#FFCB8E",
      accent: "#8C6BFF",
      shade: "#000000",
      depth: 1,
    },
    assessment: {
      from: "#0F3B4C",
      to: "#1F9A96",
      light: "#A8F2E4",
      accent: "#20C4B4",
      shade: "#000000",
      depth: 1,
    },
    documentation: {
      from: "#1B1550",
      to: "#3E2CAA",
      light: "#AEC8FF",
      accent: "#6C4CF1",
      shade: "#000000",
      depth: 1,
    },
    "care-plan": {
      from: "#4433B4",
      to: "#8E77FF",
      light: "#FFFFFF",
      accent: "#20C4B4",
      shade: "#000000",
      depth: 1,
    },
    support: {
      from: "#141039",
      to: "#2E2185",
      light: "#FFB673",
      accent: "#6C4CF1",
      shade: "#000000",
      depth: 1,
    },
  },
  /* Obsidian variants. These sit inside framed panels, so they start a clear
     step above the page canvas rather than at it — starting at #0A0A13 made
     every frame dissolve into the background. Shading bottoms out at the
     canvas colour so the lift survives the floor gradient. */
  night: {
    "home-visit": {
      from: "#17171f",
      to: "#232c42",
      light: "#a8c4ee",
      accent: "#5b5b90",
      shade: "#0a0a13",
      depth: 0.55,
    },
    assessment: {
      from: "#15151d",
      to: "#1d2937",
      light: "#9dc0e6",
      accent: "#5b5b90",
      shade: "#0a0a13",
      depth: 0.5,
    },
    documentation: {
      from: "#16161f",
      to: "#223050",
      light: "#a8c4ee",
      accent: "#5b5b90",
      shade: "#0a0a13",
      depth: 0.55,
    },
    "care-plan": {
      from: "#18181f",
      to: "#242e45",
      light: "#d6dfee",
      accent: "#5b5b90",
      shade: "#0a0a13",
      depth: 0.45,
    },
    support: {
      from: "#14141c",
      to: "#22304a",
      light: "#a8c4ee",
      accent: "#5b5b90",
      shade: "#0a0a13",
      depth: 0.55,
    },
  },
  /* Ivory-ground variants: the same compositions lit from white instead of
     black, so they read as warm paper rather than as dark panels. */
  warm: {
    "home-visit": {
      from: "#FAF5EA",
      to: "#DCC79E",
      light: "#FFFFFF",
      accent: "#E0CBA4",
      shade: "#7C6440",
      depth: 0.5,
    },
    assessment: {
      from: "#FBF7EE",
      to: "#D6C7A6",
      light: "#FFFFFF",
      accent: "#CBB489",
      shade: "#6E5A38",
      depth: 0.45,
    },
    documentation: {
      from: "#F8F2E4",
      to: "#DAC49B",
      light: "#FFFDF7",
      accent: "#C9A86A",
      shade: "#7C6440",
      depth: 0.5,
    },
    "care-plan": {
      from: "#FCF8F0",
      to: "#E2D2B0",
      light: "#FFFFFF",
      accent: "#D3BE95",
      shade: "#6E5A38",
      depth: 0.42,
    },
    support: {
      from: "#F6EFE0",
      to: "#DCC69C",
      light: "#FFFFFF",
      accent: "#C9A86A",
      shade: "#7C6440",
      depth: 0.5,
    },
  },
};

/**
 * Brand-palette scene artwork used as the site's imagery.
 *
 * These are deliberately abstract compositions — light, depth and structure
 * rather than literal subjects — so the motion layer has something with real
 * tonal range to pan across. To swap in photography, give the corresponding
 * entry in `landing-media.ts` a `src` and `SceneImage` will render an <img>
 * instead; nothing else in the motion system changes.
 */
export function SceneArt({
  scene,
  tone = "cool",
  className,
}: {
  scene: SceneArtKey;
  tone?: SceneTone;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const palette = PALETTES[tone][scene];

  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0%" stopColor={palette.light} stopOpacity="0.85" />
          <stop offset="60%" stopColor={palette.light} stopOpacity="0.18" />
          <stop offset="100%" stopColor={palette.light} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-accent`}>
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.shade} stopOpacity={shade(0.05, palette)} />
          <stop offset="100%" stopColor={palette.shade} stopOpacity={shade(0.45, palette)} />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="34" />
        </filter>
        <filter id={`${uid}-haze`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width="1200" height="800" fill={`url(#${uid}-bg)`} />

      <SceneBody scene={scene} uid={uid} palette={palette} />

      {/* Depth: darken the lower frame so overlaid copy always has contrast. */}
      <rect y="360" width="1200" height="440" fill={`url(#${uid}-floor)`} />
      {/* A whisper of film grain keeps the flat gradients from banding. */}
      <rect
        width="1200"
        height="800"
        filter={`url(#${uid}-grain)`}
        opacity="0.13"
        style={{ mixBlendMode: "overlay" }}
      />
    </svg>
  );
}

/** Scales a shading opacity to the palette's ground. */
function shade(value: number, palette: Palette) {
  return Number((value * palette.depth).toFixed(3));
}

function SceneBody({ scene, uid, palette }: { scene: SceneArtKey; uid: string; palette: Palette }) {
  switch (scene) {
    /* A room at golden hour: window, light falling across the floor, and an
       out-of-focus mass in the near foreground. */
    case "home-visit":
      return (
        <>
          <ellipse cx="880" cy="230" rx="460" ry="380" fill={`url(#${uid}-glow)`} />
          <g opacity="0.9">
            <rect x="690" y="86" width="392" height="392" rx="18" fill={`url(#${uid}-sheen)`} />
            <rect x="884" y="86" width="4" height="392" fill={palette.light} opacity="0.35" />
            <rect x="690" y="278" width="392" height="4" fill={palette.light} opacity="0.35" />
          </g>
          <path d="M690 478 L1082 478 L1200 800 L440 800 Z" fill={palette.light} opacity="0.14" />
          <path d="M0 560 H1200 V800 H0 Z" fill={`url(#${uid}-floor)`} opacity="0.7" />
          <ellipse
            cx="180"
            cy="640"
            rx="240"
            ry="260"
            fill={palette.shade}
            opacity={shade(0.32, palette)}
            filter={`url(#${uid}-soft)`}
          />
          <ellipse
            cx="430"
            cy="300"
            rx="120"
            ry="150"
            fill={palette.accent}
            opacity="0.45"
            filter={`url(#${uid}-soft)`}
          />
        </>
      );

    /* Macro close-up: large soft arcs sliding past each other, the way a
       shallow depth of field renders hands at work. */
    case "assessment":
      return (
        <>
          <ellipse cx="380" cy="300" rx="520" ry="420" fill={`url(#${uid}-glow)`} opacity="0.7" />
          <path
            d="M-60 620 C 220 380 520 300 900 340 C 1080 360 1180 430 1260 520 L1260 800 L-60 800 Z"
            fill={palette.shade}
            opacity={shade(0.24, palette)}
          />
          <path
            d="M-40 520 C 260 300 600 236 980 300"
            stroke={palette.light}
            strokeOpacity="0.5"
            strokeWidth="10"
            fill="none"
            filter={`url(#${uid}-haze)`}
          />
          <ellipse
            cx="940"
            cy="640"
            rx="360"
            ry="300"
            fill={palette.shade}
            opacity={shade(0.35, palette)}
            filter={`url(#${uid}-soft)`}
          />
          <g filter={`url(#${uid}-haze)`} opacity="0.5">
            <circle cx="252" cy="150" r="26" fill={palette.light} />
            <circle cx="360" cy="96" r="14" fill={palette.light} />
            <circle cx="150" cy="238" r="18" fill={palette.light} />
          </g>
        </>
      );

    /* A desk after a visit: the screen is the only hard light in the frame. */
    case "documentation":
      return (
        <>
          <ellipse cx="300" cy="120" rx="420" ry="320" fill={`url(#${uid}-accent)`} />
          <path
            d="M-40 520 L1240 452 L1240 800 L-40 800 Z"
            fill={`url(#${uid}-floor)`}
            opacity="0.8"
          />
          <g transform="rotate(-6 600 470)">
            <rect x="392" y="290" width="470" height="316" rx="26" fill={`url(#${uid}-sheen)`} />
            <rect
              x="418"
              y="316"
              width="418"
              height="264"
              rx="14"
              fill={palette.light}
              opacity="0.24"
            />
            <rect
              x="452"
              y="356"
              width="256"
              height="14"
              rx="7"
              fill={palette.light}
              opacity="0.6"
            />
            <rect
              x="452"
              y="396"
              width="330"
              height="10"
              rx="5"
              fill={palette.light}
              opacity="0.36"
            />
            <rect
              x="452"
              y="428"
              width="298"
              height="10"
              rx="5"
              fill={palette.light}
              opacity="0.28"
            />
            <rect
              x="452"
              y="460"
              width="330"
              height="10"
              rx="5"
              fill={palette.light}
              opacity="0.2"
            />
            <rect
              x="452"
              y="506"
              width="128"
              height="34"
              rx="17"
              fill={palette.accent}
              opacity="0.75"
            />
          </g>
          <ellipse cx="640" cy="440" rx="360" ry="240" fill={`url(#${uid}-glow)`} opacity="0.42" />
          <ellipse
            cx="1090"
            cy="700"
            rx="280"
            ry="220"
            fill={palette.shade}
            opacity={shade(0.3, palette)}
            filter={`url(#${uid}-soft)`}
          />
        </>
      );

    /* The week ahead: panels floating at different depths, calendar-like. */
    case "care-plan":
      return (
        <>
          <ellipse cx="620" cy="300" rx="620" ry="420" fill={`url(#${uid}-glow)`} opacity="0.42" />
          <g opacity="0.9">
            <rect x="120" y="238" width="330" height="404" rx="30" fill="#FFFFFF" opacity="0.1" />
            <rect x="742" y="212" width="352" height="430" rx="30" fill="#FFFFFF" opacity="0.14" />
            <rect x="404" y="168" width="404" height="500" rx="34" fill={`url(#${uid}-sheen)`} />
            <g fill="#FFFFFF">
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3, 4].map((col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={444 + col * 66}
                    y={272 + row * 82}
                    width="46"
                    height="46"
                    rx="14"
                    opacity={row === 1 && col === 2 ? 0.85 : 0.16 + row * 0.04}
                  />
                )),
              )}
            </g>
            <rect x="444" y="212" width="150" height="12" rx="6" fill="#FFFFFF" opacity="0.5" />
          </g>
          <ellipse
            cx="1010"
            cy="660"
            rx="300"
            ry="240"
            fill={palette.accent}
            opacity="0.3"
            filter={`url(#${uid}-soft)`}
          />
        </>
      );

    /* Night, and a light still on: a warm beacon with slow rings around it. */
    case "support":
      return (
        <>
          <ellipse cx="880" cy="420" rx="420" ry="420" fill={`url(#${uid}-glow)`} opacity="0.8" />
          <g stroke={palette.light} fill="none" opacity="0.22">
            <circle cx="880" cy="420" r="180" strokeWidth="2" />
            <circle cx="880" cy="420" r="290" strokeWidth="1.5" opacity="0.7" />
            <circle cx="880" cy="420" r="410" strokeWidth="1" opacity="0.45" />
          </g>
          <circle
            cx="880"
            cy="420"
            r="64"
            fill={palette.light}
            opacity="0.75"
            filter={`url(#${uid}-haze)`}
          />
          <path d="M-40 596 H1240 V800 H-40 Z" fill={`url(#${uid}-floor)`} opacity="0.8" />
          <ellipse
            cx="210"
            cy="520"
            rx="300"
            ry="280"
            fill={palette.accent}
            opacity="0.35"
            filter={`url(#${uid}-soft)`}
          />
        </>
      );
  }
}
