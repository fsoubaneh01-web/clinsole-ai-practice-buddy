import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DICTATION_LIMIT_MESSAGE,
  monthStartIso,
  serverMonthlyMinuteLimit,
} from "./dictation-limits";

/**
 * Returns the signed-in nurse's dictation usage for the current calendar month
 * against the configurable pilot cap.
 */
export const getDictationQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const limitMinutes = serverMonthlyMinuteLimit(process.env);

    const { data, error } = await context.supabase
      .from("dictation_usage")
      .select("duration_seconds")
      .eq("user_id", context.userId)
      .gte("created_at", monthStartIso());
    if (error) throw new Error(error.message);

    const seconds = (data ?? []).reduce((s, r) => s + Number(r.duration_seconds ?? 0), 0);
    const usedMinutes = Math.round((seconds / 60) * 10) / 10;
    const remainingMinutes = Math.max(0, Math.round((limitMinutes - usedMinutes) * 10) / 10);
    const limitReached = usedMinutes >= limitMinutes;

    return {
      usedMinutes,
      limitMinutes,
      remainingMinutes,
      limitReached,
      message: limitReached ? DICTATION_LIMIT_MESSAGE : null,
    };
  });
