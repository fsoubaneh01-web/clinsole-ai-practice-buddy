import type { Appointment, Patient } from "@/lib/store";

export type PendingNote = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  date: string;
  visitType: string;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * A "note to finish" = a visit that has already happened (appointment start time
 * in the past) with no SOAP treatment recorded for it.
 *
 * A treatment counts for a visit when it was written any time from the start of
 * the visit day up until the patient's next appointment. Nurses often finish a
 * note hours or days later, so matching strictly on the same calendar day left
 * completed visits stuck in the list.
 */
export function pendingNotes(
  appointments: Appointment[],
  patients: Patient[],
  now: Date = new Date(),
  lookbackDays = 30,
): PendingNote[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const treatmentTimes = new Map<string, number[]>();
  for (const p of patients) {
    treatmentTimes.set(
      p.id,
      p.treatments
        .map((t) => new Date(t.date).getTime())
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b),
    );
  }

  // Past appointments per patient, ascending, so we can bound each visit by the next one.
  const past = appointments
    .map((a) => ({ a, t: new Date(a.date).getTime() }))
    .filter((x) => !Number.isNaN(x.t) && x.t <= now.getTime())
    .sort((x, y) => x.t - y.t);

  const nextByAppointment = new Map<string, number>();
  const byPatient = new Map<string, { a: Appointment; t: number }[]>();
  for (const x of past) {
    const list = byPatient.get(x.a.patientId) ?? [];
    list.push(x);
    byPatient.set(x.a.patientId, list);
  }
  for (const [, list] of byPatient) {
    for (let i = 0; i < list.length; i++) {
      nextByAppointment.set(list[i].a.id, list[i + 1]?.t ?? Infinity);
    }
  }

  return past
    .filter((x) => {
      if (x.t < cutoff.getTime()) return false;
      const from = startOfDay(new Date(x.t));
      const until = nextByAppointment.get(x.a.id) ?? Infinity;
      const times = treatmentTimes.get(x.a.patientId) ?? [];
      return !times.some((t) => t >= from && t < until);
    })
    .sort((x, y) => y.t - x.t)
    .map(({ a }) => ({
      appointmentId: a.id,
      patientId: a.patientId,
      patientName: a.patientName,
      date: a.date,
      visitType: a.type,
    }));
}
