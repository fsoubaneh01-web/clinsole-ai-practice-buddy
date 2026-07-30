import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  /** Base64-encoded audio payload (no data: prefix). */
  audioBase64: z.string().min(1).max(30_000_000),
  mimeType: z.string().min(3).max(100),
  durationSeconds: z.number().min(0).max(3600),
  visitId: z.string().max(200).optional(),
});

export const transcribeDictation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { transcribeMedicalAudio, estimateCost, mediaFormatFor, base64ToBytes } =
      await import("./dictation.server");

    const bytes = base64ToBytes(data.audioBase64);
    const { format, contentType } = mediaFormatFor(data.mimeType);

    const transcript = await transcribeMedicalAudio(bytes, format, contentType);

    const estimated_cost = estimateCost(data.durationSeconds);
    await context.supabase.from("dictation_usage").insert({
      user_id: context.userId,
      visit_id: data.visitId ?? null,
      duration_seconds: Math.round(data.durationSeconds * 10) / 10,
      estimated_cost,
    });

    return { transcript, durationSeconds: data.durationSeconds, estimatedCost: estimated_cost };
  });
