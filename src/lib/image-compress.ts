/**
 * Client-side image downscaling for clinical photos.
 * Phone photos are 3–6 MB; we downscale the long edge to ~1600px and encode
 * JPEG at quality 0.82, which lands around 300–500 KB while keeping enough
 * detail for wound / callus documentation.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;
/** Small, stable data URL used for the on-screen thumbnail (no blob URL to revoke). */
const THUMB_EDGE = 480;
const THUMB_QUALITY = 0.7;

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: CanvasImageSource; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return { width: bmp.width, height: bmp.height, draw: bmp, close: () => bmp.close?.() };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight, draw: img, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function scaledCanvas(src: CanvasImageSource, w: number, h: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}

export type PreparedPhoto = {
  /** Downscaled JPEG to upload (falls back to the original on any failure). */
  file: File;
  /** Self-contained data URL for the thumbnail — safe across re-renders/re-decodes. */
  thumbnail: string;
};

/** Downscale + encode a photo for upload, plus a durable thumbnail data URL. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  try {
    const { width, height, draw, close } = await loadBitmap(file);
    try {
      const full = scaledCanvas(draw, width, height, MAX_EDGE);
      const blob = await toBlob(full, QUALITY);
      const thumb = scaledCanvas(draw, width, height, THUMB_EDGE).toDataURL("image/jpeg", THUMB_QUALITY);

      // Only keep the re-encode when it actually saves bytes.
      const useCompressed = blob && blob.size > 0 && blob.size < file.size;
      const name = file.name.replace(/\.[^.]+$/, "") || "photo";
      return {
        file: useCompressed ? new File([blob], `${name}.jpg`, { type: "image/jpeg" }) : file,
        thumbnail: thumb,
      };
    } finally {
      close();
    }
  } catch {
    // Fall back to the raw file + a blob URL thumbnail if canvas encoding fails.
    return { file, thumbnail: URL.createObjectURL(file) };
  }
}
