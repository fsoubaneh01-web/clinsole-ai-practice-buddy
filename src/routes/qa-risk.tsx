import { createFileRoute } from "@tanstack/react-router";
import { RiskBadge, RiskPill } from "@/components/RiskBadge";
import { ReferralFlagCard } from "@/components/ReferralFlag";
import { computeRisk } from "@/lib/risk-score";
import type { FootAssessment, Patient } from "@/lib/store";

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

const samplePatient = {
  id: "p", name: "Harold Whitaker", dob: "1948-03-12", phone: "(416) 555-0142",
  email: "", address: "", conditions: ["Type 2 diabetes", "Hypertension"],
  diabetesStatus: "type2", allergies: "Penicillin", notes: "", assessments: [],
  treatments: [], nextFollowUp: undefined,
} as unknown as Patient;

const flaggedVisit: FootAssessment[] = [
  {
    ...base,
    id: "a1", side: "R", regionLabel: "Heel · plantar",
    skinUlcer: true, skinInfection: true,
    pulsesPresent: "absent dorsalis pedis, diminished posterior tibial",
    capillaryRefill: "4 seconds",
    protectiveSensation: "absent at 4 of 10 sites",
    measurements: { length: 22, width: 15, depth: 4 },
    trend: "worsening",
    notes: "Surrounding redness and warmth, serous drainage noted; wound enlarging since last visit.",
  },
];

function QaRisk() {
  const highRisk = computeRisk(flaggedVisit, samplePatient);
  const moderate = computeRisk([{ ...base, protectiveSensation: "reduced at 3 sites", capillaryRefill: "4 seconds" }], {
    conditions: ["Bunion"], notes: "", diabetesStatus: "type2",
  } as any);
  const low = computeRisk([{ ...base, protectiveSensation: "intact", pulsesPresent: "palpable", capillaryRefill: "2 seconds" }], {
    conditions: [], notes: "", diabetesStatus: "none",
  } as any);

  return (
    <div className="min-h-screen bg-background p-5 space-y-4">
      <h1 className="text-lg font-bold">Referral flagging — sample flagged visit</h1>
      <RiskBadge risk={highRisk} />
      <ReferralFlagCard patient={samplePatient} assessments={flaggedVisit} risk={highRisk} />
      <h2 className="pt-4 text-sm font-bold text-muted-foreground">Risk samples</h2>
      <RiskBadge risk={moderate} />
      <RiskBadge risk={low} />
      <div className="flex flex-wrap gap-2">
        <RiskPill risk={highRisk} /><RiskPill risk={moderate} /><RiskPill risk={low} />
      </div>
    </div>
  );
}
