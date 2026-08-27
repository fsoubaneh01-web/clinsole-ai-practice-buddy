/**
 * Identifies the bundle the browser is actually running.
 *
 * Without this, "is the deployed app running my change?" can only be inferred
 * from behaviour — which is exactly how several rounds of on-device debugging
 * were spent against a stale bundle while everyone reasoned about merged code.
 *
 * Both values are substituted at build time by vite.config.ts. The commit is
 * only available when the build machine has git or exports a commit env var;
 * the timestamp is always available, and on its own answers the question that
 * matters most — is this bundle newer than the deploy I last tested?
 */

declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;

const read = (value: () => string, fallback: string) => {
  try {
    const v = value();
    return v && v !== "unknown" ? v : fallback;
  } catch {
    return fallback;
  }
};

/** Short commit SHA, or "unknown" when the build machine could not supply one. */
export const BUILD_COMMIT = read(() => __BUILD_COMMIT__, "unknown");

/** ISO timestamp of the build. */
export const BUILD_TIME = read(() => __BUILD_TIME__, "");

/** One line for display, e.g. "a1b2c3d · built 21 Aug 2026, 03:14 UTC". */
export function buildLabel(): string {
  const parts: string[] = [];
  if (BUILD_COMMIT !== "unknown") parts.push(BUILD_COMMIT);
  if (BUILD_TIME) {
    const d = new Date(BUILD_TIME);
    if (!isNaN(d.getTime())) {
      parts.push(
        `built ${d.toLocaleString("en-CA", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
          hour12: false,
        })} UTC`,
      );
    }
  }
  return parts.join(" · ") || "build details unavailable";
}
