import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dictationDuration,
  encodeDictationWav,
  DICTATION_SAMPLE_RATE,
} from "../src/lib/dictation-audio";

test("duration is derived from PCM samples, including the maximum clip", () => {
  for (const seconds of [0.5, 15, 89.9, 90]) {
    const wav = encodeDictationWav(new Float32Array(seconds * DICTATION_SAMPLE_RATE));
    assert.equal(dictationDuration(new Uint8Array(wav)), seconds);
  }
});

test("rejects empty, oversized, truncated, and forged-duration recordings", () => {
  assert.throws(() => encodeDictationWav(new Float32Array(0)));
  assert.throws(() => encodeDictationWav(new Float32Array(91 * DICTATION_SAMPLE_RATE)));
  const valid = new Uint8Array(encodeDictationWav(new Float32Array(DICTATION_SAMPLE_RATE)));
  assert.throws(() => dictationDuration(valid.subarray(0, valid.length - 2)));
  for (const offset of [0, 4, 8, 16, 20, 22, 24, 28, 32, 34, 36, 40]) {
    const forged = valid.slice();
    forged[offset] ^= 1;
    assert.throws(() => dictationDuration(forged), `header byte ${offset}`);
  }
});

test("PCM encoding saturates samples without integer wrapping", () => {
  const wav = encodeDictationWav(new Float32Array([-2, -1, 0, 1, 2]));
  const view = new DataView(wav);
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((i) => view.getInt16(44 + i * 2, true)),
    [-32768, -32768, 0, 32767, 32767],
  );
});
