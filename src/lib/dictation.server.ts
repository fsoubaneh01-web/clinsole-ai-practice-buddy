export { transcribeMedicalAudio, getAwsConfig } from "./aws-transcribe.server";

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
