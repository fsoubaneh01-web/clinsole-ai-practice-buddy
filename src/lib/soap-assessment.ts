export type SoapDraft = { s: string; o: string; a: string; p: string };

/** Clinical interpretation belongs to the nurse, not the drafting model. */
export function withNurseAssessment(draft: SoapDraft, nurseAssessment = ""): SoapDraft {
  return { ...draft, a: nurseAssessment.trim() || "Not documented" };
}
