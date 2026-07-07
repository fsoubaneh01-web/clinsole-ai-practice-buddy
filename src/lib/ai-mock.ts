// Mock AI generators — fast, plausible outputs. Wire to Lovable AI later.

export async function generateSOAP(input: {
  patientName: string;
  age?: number;
  conditions?: string[];
  briefNotes: string;
}) {
  await new Promise((r) => setTimeout(r, 900));
  const cond = input.conditions?.join(", ") || "no known chronic conditions";
  const n = input.briefNotes.trim() || "routine foot care";
  return {
    s: `${input.patientName}${input.age ? ` (${input.age})` : ""} presents for scheduled foot care. Patient reports: ${n}. History of ${cond}. Denies acute pain, fever, or new wounds.`,
    o: `Bilateral lower extremities inspected. Skin intact, no ulceration or maceration. Nails thickened with mild onycauxis. Pedal pulses palpable bilaterally. Monofilament sensation intact at 8/10 sites. No signs of active infection.`,
    a: `Stable foot health with maintenance care needs. ${input.conditions?.length ? "Elevated risk secondary to underlying conditions requires ongoing surveillance." : "Low-risk foot status."} No acute concerns identified today.`,
    p: `Nail reduction and filing performed. Callus debridement as indicated. Emollient applied bilaterally. Patient/caregiver reminded of daily inspection and appropriate footwear. Follow-up scheduled in 4-6 weeks or sooner PRN.`,
  };
}

export type AssistantKind = "followup" | "education" | "marketing" | "business";

export async function generateAssistant(kind: AssistantKind, prompt: string) {
  await new Promise((r) => setTimeout(r, 800));
  const p = prompt.trim();
  switch (kind) {
    case "followup":
      return `Hi ${p || "there"}, this is your foot care nurse checking in. It's been about 4 weeks since our last visit — I'd love to book your next appointment to keep your feet healthy and comfortable. Reply with a day that works and I'll confirm a time. Take care!`;
    case "education":
      return `**Caring for your feet at home**\n\n1. Inspect your feet daily for cuts, blisters or colour changes — use a mirror if needed.\n2. Wash with lukewarm water and pat dry, especially between toes.\n3. Apply moisturizer to the tops and bottoms of feet (avoid between toes).\n4. Wear clean socks and well-fitting shoes — never barefoot.\n5. Call your nurse if you notice redness, swelling, warmth, or a wound that isn't healing.\n\nTopic focus: ${p || "general foot care"}.`;
    case "marketing":
      return `**Healthy feet, delivered to your door.**\n\nMobile foot care by a Registered Nurse — right in your home. Professional nail care, callus reduction, diabetic foot assessments, and personalized care plans.\n\n✔ RN-led, evidence-based care\n✔ Same-day booking often available\n✔ Serving ${p || "your neighbourhood"}\n\nBook today — your feet will thank you.`;
    case "business":
      return `**Growth suggestions**\n\n• Package a "Quarterly Diabetic Foot Check" — 4 visits pre-paid; steady recurring revenue.\n• Partner with 2-3 local retirement residences for on-site clinic days.\n• Ask your last 10 satisfied patients for a Google review; add a QR card to your kit.\n• Track no-shows: a 24h SMS reminder typically cuts them by ~30%.\n• Consider a small price increase (~8%) at your next quarter — most independent nurses under-price.\n\nContext: ${p || "general practice growth"}.`;
  }
}
