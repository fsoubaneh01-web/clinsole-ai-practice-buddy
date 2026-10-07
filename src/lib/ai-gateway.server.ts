import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGateway, type LanguageModel } from "ai";

/** Existing Lovable deployments keep their provider unless explicitly changed. */
export function getTextModel(env = process.env): LanguageModel {
  const provider = env.CLINSOLE_AI_PROVIDER || "lovable";
  if (provider === "gateway") {
    const model = env.AI_GATEWAY_MODEL;
    if (!model || !model.includes("/")) {
      throw new Error("AI is not configured: set AI_GATEWAY_MODEL on the server.");
    }
    if (!env.AI_GATEWAY_API_KEY && !env.VERCEL_OIDC_TOKEN) {
      throw new Error("AI is not configured: missing gateway authentication.");
    }
    return createGateway({ apiKey: env.AI_GATEWAY_API_KEY })(model);
  }
  if (provider !== "lovable") throw new Error("Unsupported CLINSOLE_AI_PROVIDER.");
  if (!env.LOVABLE_API_KEY) throw new Error("AI is not configured on the server.");
  return createLovableAiGatewayProvider(env.LOVABLE_API_KEY)(
    env.LOVABLE_AI_MODEL || "google/gemini-2.5-flash",
  );
}

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
