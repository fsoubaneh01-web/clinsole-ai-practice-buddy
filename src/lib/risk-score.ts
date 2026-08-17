import type { FootAssessment, Patient } from "@/lib/store";

/**
 * Documentation aid — IWGDF / LEAP style risk stratification computed from
 * findings already documented in a visit. Not a diagnosis.
 *
 * Category 0: no neuropathy, no PAD
 * Category 1: loss of protective sensation (LOPS) only
 * Category 2: LOPS + PAD, or LOPS + foot deformity
 * Category 3: history of ulcer or lower-extremity amputation (or active ulcer)
 */
export type RiskCategory = 0 | 1 | 2 | 3;
export type RiskDisplay = "low" | "moderate" | "high";

export type RiskResult = {
  category: RiskCategory;
  level: RiskDisplay;
  reasons: string[];
  explanation: string;
  factors: {
    neuropathy: boolean;
    pad: boolean;
    activeUlcer: boolean;
    ulcerOrAmputationHistory: boolean;
    deformity: boolean;
  };
  hasData: boolean;
  visitDate?: string;
};

const has = (hay: string | undefined, needles: string[]) => {
  const s = (hay ?? "").toLowerCase();
  return needles.some((n) => s.includes(n));
};

const NEURO_TERMS = ["absent", "reduced", "diminished", "impaired", "loss", "lops", "insensate"];
const PULSE_TERMS = ["absent", "diminished", "reduced", "weak", "non-palpable", "not palpable"];
const DEFORMITY_TERMS = ["charcot", "bunion", "hallux valgus", "hammer toe", "hammertoe", "claw toe", "deformity", "prominence", "rocker bottom"];
const AMPUTATION_TERMS = ["amputat", "prior ulcer", "previous ulcer", "history of ulcer", "healed ulcer", "toe removed"];

function capRefillOver3s(v: string | undefined): boolean {
  const s = (v ?? "").toLowerCase();
  if (!s) return false;
  if (s.includes(">3") || s.includes("> 3") || s.includes("delayed") || s.includes("sluggish")) return true;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) > 3 : false;
}

/** Assessments belonging to the same visit = same calendar day as the newest one. */
export function visitAssessments(all: FootAssessment[], patientId: string, dayISO?: string): FootAssessment[] {
  const mine = all
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const day = (dayISO ?? mine[0]?.date ?? "").slice(0, 10);
  if (!day) return [];
  return mine.filter((a) => a.date.slice(0, 10) === day);
}

export function computeRisk(
  assessments: FootAssessment[],
  patient?: Pick<Patient, "conditions" | "notes" | "diabetesStatus"> | null,
): RiskResult {
  const historyText = [
    ...(patient?.conditions ?? []),
    patient?.notes ?? "",
  ].join(" ; ");

  const reasons: string[] = [];

  const neuropathy = assessments.some(
    (a) =>
      has(a.protectiveSensation, NEURO_TERMS) ||
      has(a.monofilamentFindings, NEURO_TERMS) ||
      has(a.neuropathyRisk, ["high", "moderate", "present"]),
  );
  if (neuropathy) reasons.push("loss of protective sensation");

  const pad =
    assessments.some((a) => has(a.pulsesPresent, PULSE_TERMS)) ||
    assessments.some((a) => capRefillOver3s(a.capillaryRefill));
  if (pad) {
    const pulses = assessments.some((a) => has(a.pulsesPresent, PULSE_TERMS));
    reasons.push(pulses ? "absent/diminished pedal pulses" : "capillary refill >3s");
  }

  const activeUlcer = assessments.some(
    (a) => a.skinUlcer || has(a.notes, ["ulcer", "open wound"]) || !!(a.measurements?.depth || a.measurements?.length),
  );
  if (activeUlcer) reasons.push("active ulceration");

  const infection = assessments.some((a) => a.skinInfection);
  if (infection) reasons.push("signs of infection");

  const deformity =
    has(historyText, DEFORMITY_TERMS) || assessments.some((a) => has(a.notes, DEFORMITY_TERMS));
  if (deformity) reasons.push("significant foot deformity");

  const ulcerOrAmputationHistory = has(historyText, AMPUTATION_TERMS);
  if (ulcerOrAmputationHistory) reasons.push("prior ulcer/amputation history");

  let category: RiskCategory = 0;
  if (activeUlcer || ulcerOrAmputationHistory) category = 3;
  else if (neuropathy && (pad || deformity)) category = 2;
  else if (neuropathy) category = 1;
  else if (pad || deformity) category = 2;

  const level: RiskDisplay = category === 3 ? "high" : category === 2 ? "moderate" : category === 1 ? "moderate" : "low";

  const hasData = assessments.length > 0;
  const label = level === "high" ? "High risk" : level === "moderate" ? "Moderate risk" : "Low risk";
  const explanation = !hasData
    ? "No assessment findings documented for this visit yet."
    : reasons.length
      ? `${label}: ${reasons.slice(0, 3).join(" + ")}`
      : `${label}: no neuropathy, vascular, or ulcer findings documented`;

  return {
    category,
    level,
    reasons,
    explanation,
    factors: { neuropathy, pad, activeUlcer, ulcerOrAmputationHistory, deformity },
    hasData,
    visitDate: assessments[0]?.date,
  };
}

export const RISK_DISCLAIMER = "Based on documented findings — confirm with clinical assessment.";

export const CATEGORY_LABEL: Record<RiskCategory, string> = {
  0: "IWGDF 0 · no risk factors",
  1: "IWGDF 1 · neuropathy only",
  2: "IWGDF 2 · neuropathy + deformity/PAD",
  3: "IWGDF 3 · ulcer or amputation history",
};
