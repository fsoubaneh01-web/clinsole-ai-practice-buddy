/**
 * Configurable dictation limits for the pilot stage.
 *
 * Client-side default can be overridden with VITE_DICTATION_MONTHLY_MINUTE_LIMIT.
 * The server is authoritative and reads DICTATION_MONTHLY_MINUTE_LIMIT /
 * DICTATION_GLOBAL_MONTHLY_SPEND_CAP inside its handlers.
 */

export const DEFAULT_MONTHLY_MINUTE_LIMIT = 120;
export const DEFAULT_GLOBAL_MONTHLY_SPEND_CAP = 15;

/** AWS Transcribe Medical rate used for cost estimates. */
export const COST_PER_MINUTE = 0.075;

export const DICTATION_LIMIT_MESSAGE =
  "You've reached this month's dictation limit during our pilot. Please type notes instead, or contact us if you need more.";

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Client-side (display) limit; the server re-checks before transcribing. */
export function clientMonthlyMinuteLimit(): number {
  return toNumber(
    import.meta.env['VITE_DICTATION_MONTHLY_MINUTE_LIMIT'],
    DEFAULT_MONTHLY_MINUTE_LIMIT,
  );
}

export { toNumber as parseLimitNumber };

/** First day of the current calendar month, as an ISO timestamp. */
export function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
