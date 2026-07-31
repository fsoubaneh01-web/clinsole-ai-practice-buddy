/**
 * Server-only spend-cap monitoring for the pilot.
 * Uses the admin client so the sum covers every nurse, not just the caller.
 */
import { DEFAULT_GLOBAL_MONTHLY_SPEND_CAP, monthStartIso, parseLimitNumber } from "./dictation-limits";

export function globalSpendCap(): number {
  return parseLimitNumber(
    process.env['DICTATION_GLOBAL_MONTHLY_SPEND_CAP'],
    DEFAULT_GLOBAL_MONTHLY_SPEND_CAP,
  );
}

/** Sums estimated_cost across all nurses for the current calendar month. */
export async function checkGlobalSpendCap(): Promise<{ spend: number; cap: number; exceeded: boolean }> {
  const cap = globalSpendCap();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("dictation_usage")
      .select("estimated_cost")
      .gte("created_at", monthStartIso());
    if (error) throw new Error(error.message);

    const spend = Math.round((data ?? []).reduce((s, r) => s + Number(r.estimated_cost ?? 0), 0) * 100) / 100;
    const exceeded = spend >= cap;
    if (exceeded) {
      console.error(
        `[dictation] GLOBAL MONTHLY SPEND CAP EXCEEDED: $${spend.toFixed(2)} of $${cap.toFixed(2)} cap for ${monthStartIso().slice(0, 7)}. Review pilot dictation usage.`,
      );
    }
    return { spend, cap, exceeded };
  } catch (e) {
    console.error("[dictation] spend cap check failed", e);
    return { spend: 0, cap, exceeded: false };
  }
}
