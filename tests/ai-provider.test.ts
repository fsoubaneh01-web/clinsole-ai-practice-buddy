import assert from "node:assert/strict";
import { test } from "node:test";
import { getTextModel } from "../src/lib/ai-gateway.server";

test("retains Lovable unless an independent provider is explicitly selected", () => {
  assert.equal(getTextModel({ LOVABLE_API_KEY: "test-only" }).modelId, "google/gemini-2.5-flash");
  assert.throws(() => getTextModel({}), /not configured/);
});

test("independent gateway config requires model and server authentication", () => {
  assert.throws(() => getTextModel({ CLINSOLE_AI_PROVIDER: "gateway" }), /AI_GATEWAY_MODEL/);
  assert.throws(
    () =>
      getTextModel({
        CLINSOLE_AI_PROVIDER: "gateway",
        AI_GATEWAY_MODEL: "google/gemini-2.5-flash",
      }),
    /authentication/,
  );
  assert.equal(
    getTextModel({
      CLINSOLE_AI_PROVIDER: "gateway",
      AI_GATEWAY_MODEL: "google/gemini-2.5-flash",
      AI_GATEWAY_API_KEY: "test-only",
    }).modelId,
    "google/gemini-2.5-flash",
  );
  assert.throws(() => getTextModel({ CLINSOLE_AI_PROVIDER: "typo" }), /Unsupported/);
});
