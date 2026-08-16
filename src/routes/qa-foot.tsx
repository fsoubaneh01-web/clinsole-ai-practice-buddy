import { createFileRoute } from "@tanstack/react-router";
import { FootAssessmentModule } from "@/components/FootAssessmentModule";

export const Route = createFileRoute("/qa-foot")({
  component: () => (
    <div className="p-4">
      <FootAssessmentModule patientName="QA Patient" />
    </div>
  ),
  head: () => ({
    meta: [
      { title: "Foot zone QA · ClinSole AI" },
      { name: "description", content: "Internal QA overlay for foot assessment zone alignment." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
