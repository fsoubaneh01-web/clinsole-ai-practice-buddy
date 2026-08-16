import { createFileRoute } from "@tanstack/react-router";
import { FootAssessmentModule } from "@/components/FootAssessmentModule";

export const Route = createFileRoute("/qa-dorsal-flip")({
  component: QaDorsalFlip,
  head: () => ({
    meta: [
      { title: "QA · Foot zone alignment" },
      { name: "description", content: "Internal QA view for foot assessment zone alignment on plantar and dorsal panels." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function QaDorsalFlip() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] p-4">
      <h1 className="mb-3 text-lg font-semibold">Foot zone QA</h1>
      <FootAssessmentModule patientName="QA Harness" patientMeta="Internal alignment check" />
    </main>
  );
}
