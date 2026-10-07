import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  patientName: z.string().min(1).max(200),
  age: z.number().min(0).max(130).nullable(),
  conditions: z.array(z.string().max(200)).max(50),
  diabetesStatus: z.string().max(50),
  allergies: z.string().max(2000),
  briefNotes: z.string().min(1).max(12000),
  assessmentSummary: z.string().max(6000).optional().default(""),
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
  .handler(async ({ data, context }) => {
    const { getTextModel } = await import("./ai-gateway.server");
    const { reserveAiCredit } = await import("./ai-usage.server");
    const model = getTextModel();
    await reserveAiCredit(context.supabase, "soap");

    const conditions = data.conditions.length ? data.conditions.join(", ") : "none reported";
    const prompt = `You are an experienced foot care nurse writing a clinical SOAP note.

Patient age: ${data.age ?? "not provided"}
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

Write in third-person clinical style. Use only explicitly documented findings.
Do not invent diagnoses, measurements, examinations, or treatments.
Identify missing information as not documented. The nurse must review the draft.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: SoapSchema }),
        prompt,
        maxOutputTokens: 2000,
        maxRetries: 0,
        timeout: 45000,
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
