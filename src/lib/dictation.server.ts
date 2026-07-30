export { transcribeMedicalAudio, estimateCost } from "./aws-transcribe.server";

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Maps a browser MediaRecorder mime type to an AWS Transcribe media format. */
export function mediaFormatFor(mimeType: string): { format: string; contentType: string } {
  const m = mimeType.toLowerCase();
  if (m.includes("webm")) return { format: "webm", contentType: "audio/webm" };
  if (m.includes("ogg")) return { format: "ogg", contentType: "audio/ogg" };
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac"))
    return { format: "mp4", contentType: "audio/mp4" };
  if (m.includes("wav")) return { format: "wav", contentType: "audio/wav" };
  if (m.includes("mpeg") || m.includes("mp3")) return { format: "mp3", contentType: "audio/mpeg" };
  return { format: "webm", contentType: "audio/webm" };
}
