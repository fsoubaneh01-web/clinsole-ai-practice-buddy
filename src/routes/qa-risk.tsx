import { createFileRoute } from "@tanstack/react-router";
import { RiskBadge, RiskPill } from "@/components/RiskBadge";
import { computeRisk } from "@/lib/risk-score";
import type { FootAssessment } from "@/lib/store";

export const Route = createFileRoute("/qa-risk")({ component: QaRisk });

const base = {
  id: "x", patientId: "p", date: new Date().toISOString(),
  leftFoot: true, rightFoot: false,
  skinDry: false, skinCallus: false, skinCorns: false, skinFissures: false,
  skinUlcer: false, skinInfection: false,
  nailsThickened: false, nailsFungal: false, nailsIngrown: false, nailsTrimmed: false, nailsDebrided: false,
  pulsesPresent: "", capillaryRefill: "", edema: "", skinTemperature: "",
  protectiveSensation: "", monofilamentFindings: "", neuropathyRisk: "",
  riskLevel: "low" as const, notes: "", photoPaths: [],
} satisfies FootAssessment;

function QaRisk() {
  const high = computeRisk([{ ...base, skinUlcer: true, pulsesPresent: "absent dorsalis pedis" }], {
    conditions: ["Type 2 diabetes"], notes: "", diabetesStatus: "type2",
  });
  const moderate = computeRisk([{ ...base, protectiveSensation: "reduced at 3 sites", capillaryRefill: "4 seconds" }], {
    conditions: ["Bunion"], notes: "", diabetesStatus: "type2",
  });
  const low = computeRisk([{ ...base, protectiveSensation: "intact", pulsesPresent: "palpable", capillaryRefill: "2 seconds" }], {
    conditions: [], notes: "", diabetesStatus: "none",
  });

  return (
    <div className="min-h-screen bg-background p-5 space-y-4">
      <h1 className="text-lg font-bold">Risk stratification — samples</h1>
      <RiskBadge risk={high} />
      <RiskBadge risk={moderate} />
      <RiskBadge risk={low} />
      <div className="flex flex-wrap gap-2">
        <RiskPill risk={high} /><RiskPill risk={moderate} /><RiskPill risk={low} />
      </div>
    </div>
  );
}
