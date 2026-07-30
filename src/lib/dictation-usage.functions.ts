import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDictationUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRow;

    // RLS returns own rows for nurses, all rows for admins.
    const { data, error } = await supabase
      .from("dictation_usage")
      .select("user_id, duration_seconds, estimated_cost, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const buckets = new Map<
      string,
      { month: string; userId: string; seconds: number; cost: number; sessions: number }
    >();
    for (const row of data ?? []) {
      const month = String(row.created_at).slice(0, 7);
      const key = `${month}|${row.user_id}`;
      const b = buckets.get(key) ?? { month, userId: row.user_id, seconds: 0, cost: 0, sessions: 0 };
      b.seconds += Number(row.duration_seconds ?? 0);
      b.cost += Number(row.estimated_cost ?? 0);
      b.sessions += 1;
      buckets.set(key, b);
    }

    const rows = Array.from(buckets.values())
      .map((b) => ({
        month: b.month,
        userId: b.userId,
        isSelf: b.userId === userId,
        minutes: Math.round((b.seconds / 60) * 10) / 10,
        cost: Math.round(b.cost * 100) / 100,
        sessions: b.sessions,
      }))
      .sort((a, b) => (a.month === b.month ? b.minutes - a.minutes : b.month.localeCompare(a.month)));

    return { isAdmin, rows };
  });
