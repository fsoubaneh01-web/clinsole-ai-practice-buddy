import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dictationDuration, MAX_DICTATION_BYTES } from "./dictation-audio";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DICTATION_LIMIT_MESSAGE,
  COST_PER_MINUTE,
  DEFAULT_GLOBAL_MONTHLY_SPEND_CAP,
  parseLimitNumber,
  serverMonthlyMinuteLimit,
} from "./dictation-limits";

const InputSchema = z.object({
  /** Base64-encoded audio payload (no data: prefix). */
  audioBase64: z
    .string()
    .min(1)
    .max(Math.ceil(MAX_DICTATION_BYTES / 3) * 4),
  mimeType: z.literal("audio/wav"),
  // Accepted for older callers, but never used for quota or billing.
  durationSeconds: z.number().min(0).max(3600).optional(),
  visitId: z.string().max(200).optional(),
});

export const transcribeDictation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { transcribeMedicalAudio, base64ToBytes, getAwsConfig } =
      await import("./dictation.server");
    getAwsConfig(); // No reservation if provider configuration is absent.
    const bytes = base64ToBytes(data.audioBase64);
    const durationSeconds = dictationDuration(bytes);
    const billableSeconds = Math.max(15, Math.ceil(durationSeconds));
    const estimated_cost = Math.round((billableSeconds / 60) * COST_PER_MINUTE * 10000) / 10000;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("reserve_dictation_usage", {
      p_user_id: context.userId,
      p_visit_id: data.visitId ?? null,
      p_seconds: billableSeconds,
      p_cost: estimated_cost,
      p_minute_limit: serverMonthlyMinuteLimit(process.env),
      p_spend_cap: parseLimitNumber(
        process.env.DICTATION_GLOBAL_MONTHLY_SPEND_CAP,
        DEFAULT_GLOBAL_MONTHLY_SPEND_CAP,
      ),
    });
    if (error) {
      if (error.message.includes("DICTATION_MONTHLY_LIMIT"))
        throw new Error(DICTATION_LIMIT_MESSAGE);
      if (error.message.includes("DICTATION_SPEND_LIMIT")) {
        throw new Error(
          "Dictation is temporarily at its pilot spending limit. Please type your notes.",
        );
      }
      throw new Error("Dictation usage verification is unavailable. Please type your notes.");
    }
    // Reservations are retained on failures: provider work may already have been billed.
    const transcript = await transcribeMedicalAudio(bytes, "wav", "audio/wav");

    return { transcript, durationSeconds, estimatedCost: estimated_cost };
  });
