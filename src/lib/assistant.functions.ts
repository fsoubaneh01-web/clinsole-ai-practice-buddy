import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type AssistantKind = "followup" | "education" | "marketing" | "business";

const InputSchema = z.object({
  kind: z.enum(["followup", "education", "marketing", "business"]),
  prompt: z.string().min(1).max(2000),
  /** Practice context from the nurse's profile — improves tone and specificity. */
  nurseName: z.string().max(200).optional().default(""),
  credentials: z.string().max(200).optional().default(""),
  serviceArea: z.string().max(200).optional().default(""),
  yearsExperience: z.number().min(0).max(80).nullable().optional().default(null),
});

const KIND_BRIEF: Record<AssistantKind, { task: string; format: string }> = {
  followup: {
    task:
      "Write a short, warm follow-up message the nurse can send directly to a patient (SMS or email). " +
      "Invite them to book their next visit and remind them of one relevant home-care habit.",
    format:
      "Plain message text only — no subject line, no placeholders in square brackets, under 120 words. " +
      "Sign off as the patient's foot care nurse.",
  },
  education: {
    task:
      "Write a patient education handout on the requested topic, in plain language a patient or caregiver can follow at home. " +
      "Include when to call the nurse.",
    format:
      "A bold markdown title, then numbered steps or short bullets. Under 250 words. Grade 6-8 reading level.",
  },
  marketing: {
    task: "Write marketing copy promoting this mobile foot care practice to prospective patients and their families.",
    format:
      "A bold headline, a short paragraph, 3-4 checkmark bullets of concrete benefits, and a closing call to action. Under 180 words.",
  },
  business: {
    task: "Suggest practical ways this independent nurse can grow or run the practice better, sized for a solo mobile provider.",
    format:
      "A bold heading, then 4-6 bullets. Each bullet names one concrete action and why it pays off. Under 220 words.",
  },
};

export const generateAssistantContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const brief = KIND_BRIEF[data.kind];
    const practice = [
      data.nurseName &&
        `Nurse: ${data.nurseName}${data.credentials ? `, ${data.credentials}` : ""}`,
      data.serviceArea && `Service area: ${data.serviceArea}`,
      data.yearsExperience ? `Years in practice: ${data.yearsExperience}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const system =
      "You are an assistant to an independent foot care nurse who runs a mobile practice. " +
      "Write in clear, warm, professional Canadian English. " +
      "Never diagnose, never promise clinical outcomes, and never invent details about a patient — " +
      "if something is unknown, keep the wording general instead of guessing. " +
      "Output the finished content only: no preamble, no explanation of what you wrote, no options to choose from.";

    const prompt = `${brief.task}

${practice ? `About the practice:\n${practice}\n\n` : ""}What the nurse asked for:
${data.prompt}

Format: ${brief.format}`;

    const { text } = await generateText({ model, system, prompt });

    const output = text.trim();
    if (!output) throw new Error("AI returned an empty response. Please try again.");
    return { text: output };
  });
