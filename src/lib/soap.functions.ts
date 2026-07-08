import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  patientName: z.string().min(1),
  age: z.number().nullable(),
  conditions: z.array(z.string()),
  diabetesStatus: z.string(),
  allergies: z.string(),
  briefNotes: z.string().min(1),
  assessmentSummary: z.string().optional().default(""),
});

const SoapSchema = z.object({
  s: z.string(),
  o: z.string(),
  a: z.string(),
  p: z.string(),
});

export const generateSoapNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const conditions = data.conditions.length ? data.conditions.join(", ") : "none reported";
    const prompt = `You are an experienced foot care nurse writing a clinical SOAP note.

Patient: ${data.patientName}${data.age ? `, age ${data.age}` : ""}
Diabetes status: ${data.diabetesStatus}
Known conditions: ${conditions}
Allergies: ${data.allergies || "none reported"}

Nurse's quick visit notes:
${data.briefNotes}
${data.assessmentSummary ? `\nStructured foot assessment findings from today's visit:\n${data.assessmentSummary}\n` : ""}

Produce a concise, professional SOAP note as JSON with fields:
- s: Subjective — patient-reported information and history relevant to today's visit.
- o: Objective — clinical observations, inspection findings, vitals, sensation/pulses as appropriate.
- a: Assessment — clinical interpretation and risk stratification.
- p: Plan — treatment performed, patient education, and follow-up recommendations.

Write in third-person clinical style. Do not invent findings not implied by the notes.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: SoapSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          const parsed = JSON.parse(error.text ?? "{}");
          return SoapSchema.parse(parsed);
        } catch {
          throw new Error("AI returned an invalid response. Please try again.");
        }
      }
      throw error;
    }
  });
