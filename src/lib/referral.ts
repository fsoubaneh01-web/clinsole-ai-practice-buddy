import { format } from "date-fns";

import type { FootAssessment, Patient } from "@/lib/store";
import { CATEGORY_LABEL, RISK_DISCLAIMER, type RiskResult } from "@/lib/risk-score";

/**
 * Documentation aid — flags visits whose documented findings commonly warrant
 * onward referral. Never a diagnosis; the nurse can dismiss with a note.
 */
export type ReferralSpecialty = "vascular" | "wound care" | "podiatry" | "specialist";

export type ReferralFlag = {
  flagged: boolean;
  specialty: ReferralSpecialty;
  criteria: string[];
  headline: string;
  urgency: "routine" | "prompt";
};

const has = (hay: string | undefined, needles: string[]) => {
  const s = (hay ?? "").toLowerCase();
  return needles.some((n) => s.includes(n));
};

const INFECTION_TERMS = ["redness", "erythema", "warm", "warmth", "drainage", "purulent", "exudate", "pus", "odour", "odor", "cellulitis", "infect"];
const CHARCOT_TERMS = ["charcot", "rocker bottom", "midfoot collapse", "hot swollen"];
const WORSENING_TERMS = ["worsening", "deteriorat", "enlarging", "increasing in size", "deeper", "spreading"];

export const REFERRAL_DISCLAIMER =
  "Referral suggestion based on documented findings only — the nurse's clinical judgement decides.";

export function evaluateReferral(
  assessments: FootAssessment[],
  risk: RiskResult,
  patient?: Pick<Patient, "conditions" | "notes" | "diabetesStatus"> | null,
): ReferralFlag {
  const criteria: string[] = [];
  const diabetic = patient?.diabetesStatus === "type1" || patient?.diabetesStatus === "type2";

  const infection =
    assessments.some((a) => a.skinInfection) || assessments.some((a) => has(a.notes, INFECTION_TERMS));
  const charcot =
    assessments.some((a) => has(a.notes, CHARCOT_TERMS)) ||
    has([...(patient?.conditions ?? []), patient?.notes ?? ""].join(" ; "), CHARCOT_TERMS);
  const worsening =
    assessments.some((a) => a.trend === "worsening") || assessments.some((a) => has(a.notes, WORSENING_TERMS));

  let specialty: ReferralSpecialty = "specialist";
  let urgency: ReferralFlag["urgency"] = "routine";

  if (risk.factors.activeUlcer && risk.factors.pad) {
    criteria.push("Active ulceration with absent/diminished pedal pulses");
    specialty = "vascular";
    urgency = "prompt";
  }
  if (charcot) {
    criteria.push("Findings suggestive of Charcot changes");
    specialty = "podiatry";
    urgency = "prompt";
  }
  if (worsening && risk.factors.activeUlcer) {
    criteria.push("Rapidly worsening wound documented");
    if (specialty === "specialist") specialty = "wound care";
    urgency = "prompt";
  }
  if (infection && diabetic) {
    criteria.push("Signs of infection (redness / warmth / drainage) in a patient with diabetes");
    if (specialty === "specialist") specialty = "wound care";
    urgency = "prompt";
  }
  if (!criteria.length && risk.factors.activeUlcer) {
    criteria.push("Active ulceration documented");
    specialty = "wound care";
  }
  if (!criteria.length && risk.category === 3) {
    criteria.push("IWGDF category 3 (ulcer or amputation history)");
    specialty = "podiatry";
  }

  const flagged = criteria.length > 0 && risk.hasData;
  const headline = flagged
    ? `This visit may warrant referral to ${specialty === "specialist" ? "a specialist" : specialty}.`
    : "No referral criteria met from documented findings.";

  return { flagged, specialty, criteria, headline, urgency };
}

export type ManualFlagState = {
  manual?: { note: string; at: string };
  dismissed?: { note: string; at: string };
};

const key = (patientId: string, dayISO: string) => `clinsole-referral-${patientId}-${dayISO.slice(0, 10)}`;

export function loadFlagState(patientId: string, dayISO: string): ManualFlagState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key(patientId, dayISO)) || "{}");
  } catch {
    return {};
  }
}

export function saveFlagState(patientId: string, dayISO: string, state: ManualFlagState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(patientId, dayISO), JSON.stringify(state));
}

function findingLines(a: FootAssessment): string[] {
  const out: string[] = [];
  const site = [a.side ? `${a.side === "left" ? "Left" : "Right"} foot` : null, a.regionLabel]
    .filter(Boolean)
    .join(" · ");
  const skin = [
    a.skinUlcer && "ulceration",
    a.skinInfection && "infection",
    a.skinFissures && "fissures",
    a.skinCallus && "callus",
    a.skinCorns && "corns",
    a.skinDry && "dry skin",
  ].filter(Boolean) as string[];
  const nails = [
    a.nailsThickened && "thickened",
    a.nailsFungal && "fungal",
    a.nailsIngrown && "ingrown",
  ].filter(Boolean) as string[];
  const m = a.measurements;
  const detail = [
    skin.length ? `Skin: ${skin.join(", ")}` : null,
    nails.length ? `Nails: ${nails.join(", ")}` : null,
    a.pulsesPresent ? `Pulses: ${a.pulsesPresent}` : null,
    a.capillaryRefill ? `Cap refill: ${a.capillaryRefill}` : null,
    a.protectiveSensation ? `Protective sensation: ${a.protectiveSensation}` : null,
    a.monofilamentFindings ? `Monofilament: ${a.monofilamentFindings}` : null,
    a.edema ? `Edema: ${a.edema}` : null,
    a.skinTemperature ? `Temperature: ${a.skinTemperature}` : null,
    m && (m.length || m.width || m.depth)
      ? `Wound: ${[m.length && `${m.length}mm L`, m.width && `${m.width}mm W`, m.depth && `${m.depth}mm D`].filter(Boolean).join(" × ")}`
      : null,
    a.pain ? `Pain: ${a.pain}` : null,
    a.trend ? `Trend: ${a.trend}` : null,
    a.notes ? `Note: ${a.notes}` : null,
  ].filter(Boolean) as string[];

  out.push(`- ${site || "Foot assessment"}${detail.length ? ` — ${detail.join("; ")}` : ""}`);
  return out;
}

export function buildReferralSummary(opts: {
  patient: Pick<Patient, "name" | "dob" | "phone" | "conditions" | "allergies" | "diabetesStatus">;
  age?: number | string;
  assessments: FootAssessment[];
  risk: RiskResult;
  flag: ReferralFlag;
  nurseName?: string;
  photoCount: number;
}): string {
  const { patient, assessments, risk, flag } = opts;
  const visitDate = assessments[0]?.date ? format(new Date(assessments[0].date), "MMMM d, yyyy") : "—";

  return [
    "CLINICAL REFERRAL SUMMARY",
    `Generated ${format(new Date(), "MMM d, yyyy HH:mm")}${opts.nurseName ? ` by ${opts.nurseName}` : ""}`,
    "",
    `Patient: ${patient.name}${opts.age ? ` (${opts.age} yrs)` : ""}`,
    patient.phone ? `Contact: ${patient.phone}` : null,
    `Diabetes status: ${patient.diabetesStatus === "none" ? "None documented" : patient.diabetesStatus.toUpperCase()}`,
    patient.conditions?.length ? `Conditions: ${patient.conditions.join(", ")}` : null,
    patient.allergies ? `Allergies: ${patient.allergies}` : null,
    "",
    `Visit date: ${visitDate}`,
    `Risk stratification: ${risk.level.toUpperCase()} — ${CATEGORY_LABEL[risk.category]}`,
    `Rationale: ${risk.explanation}`,
    "",
    `SUGGESTED REFERRAL: ${flag.specialty === "specialist" ? "Specialist" : flag.specialty.toUpperCase()}${flag.urgency === "prompt" ? " (prompt)" : ""}`,
    ...flag.criteria.map((c) => `• ${c}`),
    "",
    "DOCUMENTED FINDINGS",
    ...assessments.flatMap(findingLines),
    "",
    `Clinical photos attached: ${opts.photoCount}`,
    "",
    RISK_DISCLAIMER,
    REFERRAL_DISCLAIMER,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
