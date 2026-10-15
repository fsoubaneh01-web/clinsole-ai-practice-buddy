type PatientHistory = {
  conditions: string[];
  diabetesStatus: string;
  allergies: string;
};

// Missing history is unknown, never a negative clinical finding.
export function formatSoapHistory(history: PatientHistory): string {
  const conditions = history.conditions.map((value) => value.trim()).filter(Boolean);
  return [
    `Diabetes status (separate structured field): ${history.diabetesStatus.trim() || "Not documented"}`,
    `Other recorded medical conditions: ${conditions.join(", ") || "Not documented"}`,
    `Recorded allergies: ${history.allergies.trim() || "Not documented"}`,
  ].join("\n");
}
