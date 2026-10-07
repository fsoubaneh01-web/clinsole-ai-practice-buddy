/** Canonical mono 16 kHz, PCM16 WAV. Its byte length determines billable duration. */
export const DICTATION_SAMPLE_RATE = 16000;
export const MAX_DICTATION_SECONDS = 90;
export const MAX_DICTATION_BYTES = 44 + MAX_DICTATION_SECONDS * DICTATION_SAMPLE_RATE * 2;

function writeText(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeDictationWav(samples: Float32Array): ArrayBuffer {
  if (!samples.length || samples.length > MAX_DICTATION_SECONDS * DICTATION_SAMPLE_RATE) {
    throw new Error("Recording must be between 0 and 90 seconds.");
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeText(view, 0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  writeText(view, 8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, DICTATION_SAMPLE_RATE, true);
  view.setUint32(28, DICTATION_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return buffer;
}

export function dictationDuration(bytes: Uint8Array): number {
  const invalid = () => {
    throw new Error("Recording format is invalid. Record again or type your notes.");
  };
  if (bytes.length <= 44 || bytes.length > MAX_DICTATION_BYTES) return invalid();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));
  const dataLength = view.getUint32(40, true);
  if (
    text(0, 4) !== "RIFF" ||
    text(8, 8) !== "WAVEfmt " ||
    text(36, 4) !== "data" ||
    view.getUint32(4, true) !== bytes.length - 8 ||
    view.getUint32(16, true) !== 16 ||
    view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== DICTATION_SAMPLE_RATE ||
    view.getUint32(28, true) !== DICTATION_SAMPLE_RATE * 2 ||
    view.getUint16(32, true) !== 2 ||
    view.getUint16(34, true) !== 16 ||
    dataLength !== bytes.length - 44 ||
    dataLength % 2 !== 0
  )
    return invalid();
  return dataLength / (DICTATION_SAMPLE_RATE * 2);
}
