import { useEffect, useState } from "react";
import { useStore, type VisitPhoto } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";

/** Loads signed URLs (1h, via store.getPhotoUrl) for a set of visit photos. */
function useSignedPhotos(photos: VisitPhoto[]) {
  const { getPhotoUrl } = useStore();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = photos.map((p) => p.path).join("|");
  useEffect(() => {
    let cancelled = false;
    Promise.all(photos.map(async (p) => [p.id, await getPhotoUrl(p.path)] as const)).then((res) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [id, url] of res) if (url) next[id] = url;
      setUrls(next);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, getPhotoUrl]);
  return urls;
}

function PhotoGrid({ photos, showDate }: { photos: VisitPhoto[]; showDate?: boolean }) {
  const urls = useSignedPhotos(photos);
  const [open, setOpen] = useState<VisitPhoto | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(p)}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
            aria-label={p.caption || "Clinical photo"}
          >
            {urls[p.id] ? (
              <img src={urls[p.id]} alt={p.caption || "Clinical photo"} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full animate-pulse bg-muted" />
            )}
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open && (
            <div className="space-y-2">
              {urls[open.id] && (
                <img src={urls[open.id]} alt={open.caption || "Clinical photo"} className="w-full rounded-xl" />
              )}
              <div className="text-sm font-medium">{open.caption || "No caption"}</div>
              {showDate && (
                <div className="text-xs text-muted-foreground">
                  {format(new Date(open.createdAt), "MMM d, yyyy · h:mm a")}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Thumbnail strip for one treatment (visit history). */
export function TreatmentPhotoStrip({ treatmentId }: { treatmentId: string }) {
  const { listVisitPhotos } = useStore();
  const [photos, setPhotos] = useState<VisitPhoto[]>([]);
  useEffect(() => {
    let cancelled = false;
    listVisitPhotos({ treatmentId }).then((r) => { if (!cancelled) setPhotos(r); });
    return () => { cancelled = true; };
  }, [treatmentId, listVisitPhotos]);
  if (!photos.length) return null;
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Photos ({photos.length})
      </div>
      <PhotoGrid photos={photos} />
    </div>
  );
}

/** All visit photos for a patient, grouped by visit date. */
export function PatientPhotoGallery({ patientId }: { patientId: string }) {
  const { listVisitPhotos } = useStore();
  const [photos, setPhotos] = useState<VisitPhoto[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    listVisitPhotos({ patientId }).then((r) => { if (!cancelled) setPhotos(r); });
    return () => { cancelled = true; };
  }, [patientId, listVisitPhotos]);

  if (photos === null) return <div className="text-sm text-muted-foreground">Loading photos…</div>;
  if (!photos.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">
        No visit photos yet.
      </div>
    );
  }
  const groups = new Map<string, VisitPhoto[]>();
  for (const p of photos) {
    const key = format(new Date(p.createdAt), "yyyy-MM-dd");
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  return (
    <div className="space-y-4">
      {[...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, list]) => (
        <div key={day} className="rounded-2xl border bg-surface p-4 shadow-soft">
          <div className="mb-2 text-sm font-semibold">{format(new Date(day), "MMM d, yyyy")}</div>
          <PhotoGrid photos={list} showDate />
        </div>
      ))}
    </div>
  );
}
