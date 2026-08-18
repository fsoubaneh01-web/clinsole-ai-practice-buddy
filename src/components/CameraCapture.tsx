import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImageIcon, Loader2, RotateCcw, X } from "lucide-react";

type Phase = "starting" | "live" | "review" | "error";

const START_TIMEOUT_MS = 5000;
const JPEG_QUALITY = 0.85;

/**
 * In-page camera. Uses getUserMedia so capture never hands off to the iOS
 * native camera app (which intermittently fails to start a live preview and
 * lets the OS evict the web view).
 */
export function CameraCapture({
  onCapture,
  onClose,
  onUseLibrary,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onUseLibrary: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState<string>("");
  const [shot, setShot] = useState<{ url: string; file: File } | null>(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    // Each attempt gets a generation id so a slow/aborted attempt can never
    // stop the stream or flip state belonging to a newer one.
    const run = ++runRef.current;
    if (import.meta.env.DEV) console.info("[camera] start", run);
    stopStream();
    setError("");
    setShot((s) => {
      if (s?.url.startsWith("blob:")) URL.revokeObjectURL(s.url);
      return null;
    });
    setPhase("starting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't open the camera in-page. Use Library instead.");
      setPhase("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (run !== runRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) { stopStream(); return; }
      v.srcObject = stream;
      try { await v.play(); } catch { /* autoplay retried by the element */ }
      setPhase("live");
      // If no decodable frame arrives, say so instead of showing a black box.
      // A real frame means non-zero dimensions plus decoded data — some devices
      // never advertise HAVE_ENOUGH_DATA for a live stream, so accept
      // HAVE_CURRENT_DATA with known dimensions too.
      timerRef.current = setTimeout(() => {
        if (import.meta.env.DEV) console.info("[camera] watchdog", run, runRef.current);
        if (run !== runRef.current) return;
        const el = videoRef.current;
        const hasFrame = !!el && el.videoWidth > 0 && el.readyState >= 2;
        if (!hasFrame) {
          stopStream();
          setError("Camera didn't start — try again or use Library.");
          setPhase("error");
        }
      }, START_TIMEOUT_MS);
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name || "";
      if (run !== runRef.current) return;
      stopStream();
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Camera access was blocked. Allow camera in Settings, or use Library."
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "No camera found on this device. Use Library instead."
            : name === "NotReadableError"
              ? "The camera is in use by another app or tab. Close it and try again."
              : "Couldn't open the camera. Try again or use Library.",
      );
      setPhase("error");
    }
  }, [stopStream]);

  useEffect(() => {
    void start();
    return () => stopStream();
  }, [start, stopStream]);

  // Release the camera if the page is hidden/navigated away from.
  useEffect(() => {
    const onHide = () => { runRef.current++; stopStream(); };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [stopStream]);

  const shutter = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { toastless("Camera isn't ready yet."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) { setError("Couldn't save the frame. Try again."); setPhase("error"); return; }
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    if (import.meta.env.DEV) console.info("[camera] shutter");
    runRef.current++; // invalidate any in-flight start attempt / watchdog
    stopStream();
    setShot({ url: URL.createObjectURL(blob), file });
    setPhase("review");
  };

  const usePhoto = () => {
    if (!shot) return;
    onCapture(shot.file);
    URL.revokeObjectURL(shot.url);
    setShot(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <span className="text-sm font-semibold">
          {phase === "review" ? "Review photo" : "Clinical photo"}
        </span>
        <button
          type="button"
          onClick={() => { stopStream(); onClose(); }}
          aria-label="Close camera"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {phase === "review" && shot ? (
          <img src={shot.url} alt="Captured clinical photo" className="h-full w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />
        )}

        {phase === "starting" && (
          <div className="absolute inset-0 grid place-items-center gap-2 text-white">
            <div className="flex flex-col items-center gap-2 text-sm">
              <Loader2 className="h-7 w-7 animate-spin" />
              Starting camera…
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center text-white">
            <div className="max-w-xs space-y-4">
              <Camera className="mx-auto h-8 w-8 opacity-70" />
              <p className="text-sm">{error}</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void start()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <RotateCcw className="h-4 w-4" /> Try again
                </button>
                <button
                  type="button"
                  onClick={() => { stopStream(); onClose(); onUseLibrary(); }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <ImageIcon className="h-4 w-4" /> Use Library
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        {phase === "review" ? (
          <>
            <button
              type="button"
              onClick={() => void start()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button
              type="button"
              onClick={usePhoto}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              <Check className="h-4 w-4" /> Use photo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void shutter()}
            disabled={phase !== "live"}
            aria-label="Take photo"
            className="grid h-[74px] w-[74px] place-items-center rounded-full border-4 border-white/80 bg-white/10 disabled:opacity-40"
          >
            <span className="h-14 w-14 rounded-full bg-primary shadow-soft" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Small local notice channel — avoids pulling toast into this leaf component. */
function toastless(msg: string) {
  if (import.meta.env.DEV) console.info("[camera]", msg);
}
