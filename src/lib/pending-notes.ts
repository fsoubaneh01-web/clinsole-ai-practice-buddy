import type { Appointment, Patient } from "@/lib/store";

export type PendingNote = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  date: string;
  visitType: string;
};

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * A "note to finish" = a visit that has already happened (appointment start time
 * in the past) with no saved SOAP treatment for that patient on that same day.
 */
export function pendingNotes(
  appointments: Appointment[],
  patients: Patient[],
  now: Date = new Date(),
  lookbackDays = 30,
): PendingNote[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const treatmentDays = new Set<string>();
  for (const p of patients) {
    for (const t of p.treatments) treatmentDays.add(`${p.id}|${dayKey(t.date)}`);
  }

  return appointments
    .filter((a) => {
      const d = new Date(a.date);
      if (Number.isNaN(d.getTime())) return false;
      if (d > now || d < cutoff) return false;
      return !treatmentDays.has(`${a.patientId}|${dayKey(a.date)}`);
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((a) => ({
      appointmentId: a.id,
      patientId: a.patientId,
      patientName: a.patientName,
      date: a.date,
      visitType: a.type,
    }));
}
