/**
 * Durable record of the clinical photos captured during a visit.
 *
 * Written at capture time, *before* the upload starts, so the visit flow can
 * always tell that a photo was taken. Component state and the uploaded-path
 * cache both disappear precisely when an upload stalls or the step remounts,
 * which is how a stalled upload could finish a visit with no photos attached
 * and no warning shown.
 *
 * Metadata only. The image itself lives in component state for the life of the
 * step, so a failed upload can be retried while the nurse is still on the visit
 * but not after a remount; in that case the entry stays `failed` and the finish
 * gate reports it rather than losing it silently.
 */

export type PhotoStatus = "pending" | "uploaded" | "failed";

export type PhotoLedgerEntry = {
  id: string;
  status: PhotoStatus;
  path?: string;
  note?: string;
  capturedAt: string;
};

const keyFor = (patientId: string) => `clinsole:photo-ledger:${patientId}`;

function read(patientId: string): PhotoLedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(keyFor(patientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PhotoLedgerEntry[]) : [];
  } catch {
    return [];
  }
}

function write(patientId: string, entries: PhotoLedgerEntry[]) {
  if (typeof window === "undefined") return;
  try {
    if (entries.length) sessionStorage.setItem(keyFor(patientId), JSON.stringify(entries));
    else sessionStorage.removeItem(keyFor(patientId));
  } catch {
    /* quota — the in-memory state still covers the common path */
  }
}

function update(patientId: string, id: string, patch: Partial<PhotoLedgerEntry>) {
  write(
    patientId,
    read(patientId).map((e) => (e.id === id ? { ...e, ...patch } : e)),
  );
}

export function readLedger(patientId: string): PhotoLedgerEntry[] {
  return read(patientId);
}

/** Call as soon as a photo exists on screen, before the upload is attempted. */
export function recordCapture(patientId: string, id: string) {
  const entries = read(patientId);
  if (entries.some((e) => e.id === id)) return;
  write(patientId, [...entries, { id, status: "pending", capturedAt: new Date().toISOString() }]);
}

export function markUploaded(patientId: string, id: string, path: string) {
  update(patientId, id, { status: "uploaded", path });
}

export function markFailed(patientId: string, id: string) {
  update(patientId, id, { status: "failed" });
}

export function setLedgerNote(patientId: string, id: string, note: string) {
  update(patientId, id, { note });
}

/** The nurse deliberately removed the photo — it should not block the finish. */
export function forgetCapture(patientId: string, id: string) {
  write(
    patientId,
    read(patientId).filter((e) => e.id !== id),
  );
}

export function clearLedger(patientId: string) {
  write(patientId, []);
}

/** Captured photos that never reached storage. Non-empty means data would be lost. */
export function unattachedEntries(entries: PhotoLedgerEntry[]): PhotoLedgerEntry[] {
  return entries.filter((e) => e.status !== "uploaded" || !e.path);
}
