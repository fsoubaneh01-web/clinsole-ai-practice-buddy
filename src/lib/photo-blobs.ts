/**
 * Durable blob storage for clinical photos that have been captured but not yet
 * uploaded.
 *
 * Component state and sessionStorage both lose the actual image bytes: state
 * dies on remount, and sessionStorage can't hold a multi-hundred-KB JPEG. So a
 * failed upload used to be unretryable after navigating away and back — the
 * ledger still said "photo taken" but the file was gone.
 *
 * IndexedDB keeps the compressed JPEG (plus its thumbnail data URL) until the
 * upload succeeds or the visit finishes.
 */

export type StoredPhotoBlob = {
  /** Composite key: `${patientId}:${id}` */
  key: string;
  patientId: string;
  id: string;
  blob: Blob;
  fileName: string;
  type: string;
  thumbnail: string;
  note: string;
  createdAt: string;
};

const DB_NAME = "clinsole";
const DB_VERSION = 1;
const STORE = "photo-blobs";

function supported() {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("patientId", "patientId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  if (!supported()) return null;
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

const keyFor = (patientId: string, id: string) => `${patientId}:${id}`;

/** Persist the compressed photo so a failed upload survives a remount. */
export async function putPhotoBlob(
  patientId: string,
  id: string,
  file: File,
  thumbnail: string,
  note = "",
): Promise<void> {
  await withStore("readwrite", (s) =>
    s.put({
      key: keyFor(patientId, id),
      patientId,
      id,
      blob: file,
      fileName: file.name || `photo-${id}.jpg`,
      type: file.type || "image/jpeg",
      thumbnail,
      note,
      createdAt: new Date().toISOString(),
    } satisfies StoredPhotoBlob) as unknown as IDBRequest<unknown>,
  );
}

export async function updatePhotoBlobNote(patientId: string, id: string, note: string): Promise<void> {
  if (!supported()) return;
  const existing = await withStore<StoredPhotoBlob>("readonly", (s) =>
    s.get(keyFor(patientId, id)) as IDBRequest<StoredPhotoBlob>,
  );
  if (!existing) return;
  await withStore("readwrite", (s) => s.put({ ...existing, note }) as unknown as IDBRequest<unknown>);
}

export async function deletePhotoBlob(patientId: string, id: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(keyFor(patientId, id)) as unknown as IDBRequest<unknown>);
}

/** All still-unuploaded photos for a patient, oldest first. */
export async function listPhotoBlobs(patientId: string): Promise<StoredPhotoBlob[]> {
  if (!supported()) return [];
  const all = await withStore<StoredPhotoBlob[]>("readonly", (s) => {
    const idx = s.index("patientId");
    return idx.getAll(IDBKeyRange.only(patientId)) as IDBRequest<StoredPhotoBlob[]>;
  });
  return (all || []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Drop every stored blob for a patient — called when a visit is finished. */
export async function clearPhotoBlobs(patientId: string): Promise<void> {
  const all = await listPhotoBlobs(patientId);
  await Promise.all(all.map((e) => deletePhotoBlob(patientId, e.id)));
}

/** Rebuild an uploadable File from a stored record. */
export function fileFromStored(entry: StoredPhotoBlob): File {
  return new File([entry.blob], entry.fileName, { type: entry.type });
}
