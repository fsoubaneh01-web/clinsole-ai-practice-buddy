import {
  DICTATION_SAMPLE_RATE,
  MAX_DICTATION_SECONDS,
  encodeDictationWav,
} from "./dictation-audio";

/** Decode browser-native recording, then resample to the server's canonical PCM. */
export async function recordingToWav(blob: Blob): Promise<ArrayBuffer> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    const frames = Math.min(
      Math.ceil(audio.duration * DICTATION_SAMPLE_RATE),
      MAX_DICTATION_SECONDS * DICTATION_SAMPLE_RATE,
    );
    if (!frames) throw new Error("No audio was captured.");
    const offline = new OfflineAudioContext(1, frames, DICTATION_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = audio;
    source.connect(offline.destination);
    source.start();
    const mono = await offline.startRendering();
    return encodeDictationWav(mono.getChannelData(0));
  } finally {
    await context.close();
  }
}
