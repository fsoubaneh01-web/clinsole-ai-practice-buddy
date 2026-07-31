import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_MONTHLY_MINUTE_LIMIT,
  DICTATION_LIMIT_MESSAGE,
  monthStartIso,
  parseLimitNumber,
} from "./dictation-limits";

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
    // Authoritative monthly cap check (the client also blocks the mic button).
    const limitMinutes = parseLimitNumber(
      process.env['DICTATION_MONTHLY_MINUTE_LIMIT'],
      DEFAULT_MONTHLY_MINUTE_LIMIT,
    );
    const { data: usageRows, error: usageError } = await context.supabase
      .from("dictation_usage")
      .select("duration_seconds")
      .eq("user_id", context.userId)
      .gte("created_at", monthStartIso());
    if (usageError) throw new Error(usageError.message);
    const usedMinutes =
      (usageRows ?? []).reduce((s, r) => s + Number(r.duration_seconds ?? 0), 0) / 60;
    if (usedMinutes >= limitMinutes) throw new Error(DICTATION_LIMIT_MESSAGE);

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

    const { checkGlobalSpendCap } = await import("./dictation-spend.server");
    await checkGlobalSpendCap();

    return { transcript, durationSeconds: data.durationSeconds, estimatedCost: estimated_cost };
  });

