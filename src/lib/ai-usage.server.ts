import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Reserve before making a paid request. PostgreSQL serializes calls per user. */
export async function reserveAiCredit(
  supabase: SupabaseClient<Database>,
  kind: "soap" | "assistant",
): Promise<number> {
  const { data, error } = await supabase.rpc("reserve_ai_usage", { p_kind: kind });
  if (error) {
    if (error.message.includes("AI_MONTHLY_LIMIT")) {
      throw new Error("You've used all AI credits on the Free plan this month.");
    }
    // Missing migration / database errors fail closed without calling a provider.
    throw new Error("AI usage verification is unavailable. Please try again later.");
  }
  if (typeof data !== "number") throw new Error("AI usage verification failed.");
  return data;
}
