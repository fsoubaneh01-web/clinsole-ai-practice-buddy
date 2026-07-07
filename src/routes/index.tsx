import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <div className="relative overflow-hidden gradient-hero px-6 pt-14 pb-16 text-primary-foreground">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest opacity-80">
            <Sparkles className="h-3.5 w-3.5" /> For independent foot care nurses
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Your entire practice, in your pocket.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
            ClinSole AI helps mobile foot care professionals document visits, manage patients, schedule appointments, and grow — powered by clinical AI.
          </p>
        </div>
      </div>

      <div className="-mt-8 flex-1 rounded-t-3xl bg-background px-6 pt-8 pb-10">
        <div className="mb-8"><Brand size="md" /></div>

        <ul className="space-y-4">
          {[
            { icon: HeartPulse, title: "AI SOAP Notes", desc: "Turn quick voice memos into full clinical documentation." },
            { icon: ShieldCheck, title: "Patient records", desc: "Assessment history, treatments, and follow-up reminders." },
            { icon: Sparkles, title: "Business assistant", desc: "Follow-ups, education handouts, marketing — written for you." },
          ].map((f) => (
            <li key={f.title} className="flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-soft">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <Button asChild size="lg" className="w-full gradient-primary text-primary-foreground shadow-card">
            <Link to="/signup">
              Start 14-day free trial <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          No credit card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}
