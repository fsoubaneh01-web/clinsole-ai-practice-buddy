/**
 * Timezone-safe helpers for appointment scheduling.
 *
 * Appointments are stored as UTC instants (timestamptz), but nurses always
 * think in local wall-clock time ("Tue 10:00"). These helpers make sure the
 * conversion is explicit and DST-correct instead of relying on string parsing,
 * which browsers treat inconsistently.
 */

/** Build a Date from a `yyyy-MM-dd` + `HH:mm` pair in the user's local timezone. */
export function parseLocalDateTime(dateStr: string, timeStr: string): Date | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr?.trim() ?? "");
  const tm = /^(\d{1,2}):(\d{2})$/.exec(timeStr?.trim() ?? "");
  if (!dm || !tm) return null;
  const [y, mo, d] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
  const [h, mi] = [Number(tm[1]), Number(tm[2])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
  // Reject impossible calendar dates (e.g. 2026-02-31 rolling into March).
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

/**
 * Add days while preserving local wall-clock time across DST changes.
 * (A raw `+ n * 86400000` shifts a 10:00 visit to 09:00 or 11:00.)
 */
export function addDaysLocal(start: Date, days: number): Date {
  const d = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + days,
    start.getHours(),
    start.getMinutes(),
    0,
    0,
  );
  return d;
}

/**
 * Add months, clamping to the last valid day (Jan 31 + 1 month = Feb 28/29,
 * never March 3) and preserving local wall-clock time across DST.
 */
export function addMonthsLocal(start: Date, months: number): Date {
  const y = start.getFullYear();
  const m = start.getMonth() + months;
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(
    y,
    m,
    Math.min(start.getDate(), lastDay),
    start.getHours(),
    start.getMinutes(),
    0,
    0,
  );
}
