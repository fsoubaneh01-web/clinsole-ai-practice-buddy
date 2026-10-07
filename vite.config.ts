import { execSync } from "node:child_process";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

/**
 * Short commit of the build, surfaced in the app so the running bundle can be
 * identified at a glance instead of inferred from behaviour. Falls back through
 * the commit env vars common CI providers set, then to git, then to "unknown" —
 * the build must never fail just because provenance is unavailable.
 */
function buildCommit(): string {
  const fromEnv =
    process.env.LOVABLE_COMMIT_SHA ??
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.COMMIT_REF;
  if (fromEnv) return fromEnv.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig(async ({ command, mode }) => {
  // Vite loads VITE_* for browsers. Server configuration stays in process.env.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  const buildDefines = {
    __BUILD_COMMIT__: JSON.stringify(buildCommit()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  };

  // Explicit compatibility path for the existing Lovable hosting environment.
  if (process.env.LOVABLE_SANDBOX === "1" || process.env.CLINSOLE_BUILD_TARGET === "lovable") {
    const { defineConfig: lovableConfig } = await import("@lovable.dev/vite-tanstack-config");
    const config = lovableConfig({
      tanstackStart: { server: { entry: "server" } },
      vite: { define: buildDefines },
    });
    return typeof config === "function" ? config({ command, mode }) : config;
  }

  return {
    plugins: [
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({ server: { entry: "server" } }),
      ...(command === "build"
        ? [nitro({ preset: process.env.NITRO_PRESET || "node-server" })]
        : []),
      react(),
    ],
    define: buildDefines,
    resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router"] },
    server: { host: "0.0.0.0", port: 3000 },
  };
});
