import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const overlapInput = z.object({
  startIso: z.string(),
  durationMin: z.number().positive(),
  excludeId: z.string().optional(),
});

/**
 * Authoritative server-side double-booking check for the signed-in nurse.
 * Returns the first overlapping appointment (if any) straight from the database,
 * so a stale client cache can't hide a real conflict.
 */
export const checkAppointmentOverlap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => overlapInput.parse(data))
  .handler(async ({ data, context }) => {
    const startMs = new Date(data.startIso).getTime();
    if (Number.isNaN(startMs)) throw new Error("Invalid appointment date.");
    const endMs = startMs + data.durationMin * 60_000;

    // Widest possible existing appointment window we need to consider.
    const windowStart = new Date(startMs - 24 * 60 * 60_000).toISOString();
    const windowEnd = new Date(endMs).toISOString();

    const { data: rows, error } = await context.supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, duration_min")
      .eq("nurse_id", context.userId)
      .gte("scheduled_at", windowStart)
      .lt("scheduled_at", windowEnd)
      .order("scheduled_at", { ascending: true });
    if (error) throw new Error(error.message);

    const clash = (rows ?? []).find((r) => {
      if (data.excludeId && r.id === data.excludeId) return false;
      const aStart = new Date(r.scheduled_at).getTime();
      const aEnd = aStart + Number(r.duration_min ?? 0) * 60_000;
      return startMs < aEnd && aStart < endMs;
    });
    if (!clash) return { conflict: null };

    const { data: patient } = await context.supabase
      .from("patients")
      .select("name")
      .eq("id", clash.patient_id)
      .maybeSingle();

    return {
      conflict: {
        id: clash.id,
        date: clash.scheduled_at,
        patientName: patient?.name ?? null,
      },
    };
  });
