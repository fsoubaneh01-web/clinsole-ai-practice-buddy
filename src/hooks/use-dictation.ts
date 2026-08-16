import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeDictation } from "@/lib/dictation.functions";
import { getDictationQuota } from "@/lib/dictation-quota.functions";
import { DICTATION_LIMIT_MESSAGE, clientMonthlyMinuteLimit } from "@/lib/dictation-limits";


export type DictationStatus = "idle" | "requesting" | "recording" | "transcribing" | "error";

function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Real microphone capture (MediaRecorder) + AWS Transcribe Medical.
 * Any failure leaves the caller's textarea usable as a typed fallback.
 */
export function useDictation(opts: {
  visitId?: string;
  onTranscript: (text: string) => void;
}) {
  const { visitId, onTranscript } = opts;
  const transcribe = useServerFn(transcribeDictation);
  const fetchQuota = useServerFn(getDictationQuota);

  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [transcribeSeconds, setTranscribeSeconds] = useState(0);
  const [quota, setQuota] = useState<{
    usedMinutes: number; limitMinutes: number; remainingMinutes: number; limitReached: boolean;
  }>({
    usedMinutes: 0,
    limitMinutes: clientMonthlyMinuteLimit(),
    remainingMinutes: clientMonthlyMinuteLimit(),
    limitReached: false,
  });

  const refreshQuota = useCallback(async () => {
    try {
      const q = await fetchQuota();
      // The build-time client limit acts as an additional (stricter) cap so the
      // mic disables even when the server env var isn't configured.
      const limitMinutes = Math.min(q.limitMinutes, clientMonthlyMinuteLimit());
      const limitReached = q.limitReached || q.usedMinutes >= limitMinutes;
      setQuota({
        usedMinutes: q.usedMinutes,
        limitMinutes,
        remainingMinutes: Math.max(0, Math.round((limitMinutes - q.usedMinutes) * 10) / 10),
        limitReached,
      });
      return limitReached;
    } catch {
      return false; // never block dictation because the quota check failed
    }
  }, [fetchQuota]);

  useEffect(() => { void refreshQuota(); }, [refreshQuota]);


  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const cleanup = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (!supported) {
      setStatus("error");
      setError("This browser doesn't support microphone recording. Please type your notes instead.");
      return;
    }
    if (quota.limitReached || (await refreshQuota())) {
      setStatus("error");
      setError(DICTATION_LIMIT_MESSAGE);
      return;
    }
    setStatus("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      setStatus("error");
      setError(
        e?.name === "NotAllowedError" || e?.name === "SecurityError"
          ? "Microphone access was denied. Enable it in your browser settings, or type your notes below."
          : e?.name === "NotFoundError"
            ? "No microphone was found. Please type your notes below."
            : "Could not start the microphone. Please type your notes below.",
      );
      return;
    }

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
      .find((t) => MediaRecorder.isTypeSupported?.(t));

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      const duration = Math.max(0.5, (Date.now() - startedAtRef.current) / 1000);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      cleanup();
      setSeconds(0);

      if (!blob.size) {
        setStatus("error");
        setError("No audio was captured. Please try again or type your notes.");
        return;
      }

      setStatus("transcribing");
      const transcribeStartedAt = Date.now();
      setTranscribeSeconds(0);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(
        () => setTranscribeSeconds(Math.floor((Date.now() - transcribeStartedAt) / 1000)),
        250,
      );
      const stopTicker = () => {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      };
      try {
        const res = await transcribe({
          data: {
            audioBase64: bytesToBase64(await blob.arrayBuffer()),
            mimeType: blob.type,
            durationSeconds: duration,
            visitId,
          },
        });
        if (res?.transcript?.trim()) {
          onTranscript(res.transcript.trim());
          setStatus("idle");
        } else {
          setStatus("error");
          setError("No speech was detected in the recording. Please try again or type your notes.");
        }
      } catch (e: any) {
        setStatus("error");
        setError(
          typeof e?.message === "string" && e.message.length < 200
            ? e.message
            : "Transcription failed — check your connection. You can type your notes below instead.",
        );
      } finally {
        void refreshQuota();
      }
    };

    recorder.onerror = () => {
      cleanup();
      setStatus("error");
      setError("Recording stopped unexpectedly. Please type your notes below.");
    };

    startedAtRef.current = Date.now();
    recorder.start();
    setSeconds(0);
    tickRef.current = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000)),
      500,
    );
    setStatus("recording");
  }, [supported, cleanup, transcribe, visitId, onTranscript, quota.limitReached, refreshQuota]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const toggle = useCallback(() => {
    if (status === "recording") stop();
    else if (status !== "transcribing" && status !== "requesting") void start();
  }, [status, start, stop]);

  return {
    status,
    error,
    seconds,
    supported,
    start,
    stop,
    toggle,
    clearError: () => setError(null),
    limitReached: quota.limitReached,
    limitMessage: quota.limitReached ? DICTATION_LIMIT_MESSAGE : null,
    usedMinutes: quota.usedMinutes,
    limitMinutes: quota.limitMinutes,
    remainingMinutes: quota.remainingMinutes,
    refreshQuota,
  };

}
