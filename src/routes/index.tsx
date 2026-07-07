import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, HeartPulse, Calendar, Wallet, Users, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClinSole AI — Practice Assistant for Foot Care Nurses" },
      { name: "description", content: "The complete practice assistant for independent foot care nurses. Manage patients, generate AI SOAP notes, schedule visits, and grow your mobile practice." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-8">
          <Brand size="sm" />
          <div className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Built for independent foot care nurses
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
              Your entire foot care practice, powered by AI.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 lg:text-lg">
              ClinSole AI is the modern practice assistant for mobile foot care nurses. Document visits with AI SOAP notes, manage patients, schedule follow-ups, and track your income — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
                <Link to="/login">I have an account</Link>
              </Button>
            </div>
            <div className="mt-6 text-xs opacity-80">No credit card required · Free plan available forever</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Everything you need</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Built specifically for foot care nurses.</h2>
          <p className="mt-3 text-muted-foreground">Not another generic EMR. ClinSole AI is designed around how mobile foot care actually works — from diabetic assessments to recurring nail care visits.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: HeartPulse, title: "AI SOAP Notes", desc: "Turn quick visit notes into full clinical documentation in seconds." },
            { icon: Users, title: "Patient records", desc: "Medical history, diabetes status, allergies, assessments, and treatment history." },
            { icon: Calendar, title: "Smart scheduling", desc: "Book visits, set recurring appointments, and send patient reminders." },
            { icon: Wallet, title: "Income tracking", desc: "Log visits, payments, and expenses. See monthly revenue at a glance." },
            { icon: Sparkles, title: "AI Business Assistant", desc: "Generate follow-ups, education handouts, and marketing content." },
            { icon: ShieldCheck, title: "Secure & private", desc: "Your patient data is encrypted and stays private to your practice." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl border bg-surface p-6 shadow-soft transition hover:shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-surface-muted py-20">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Simple pricing</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Start free. Upgrade when you're ready.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border bg-surface p-8 shadow-soft">
              <div className="text-lg font-bold">Free</div>
              <div className="mt-3 flex items-baseline gap-1">
                <div className="text-5xl font-bold">$0</div>
                <div className="text-sm text-muted-foreground">forever</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Perfect for getting started.</p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Up to 10 patients", "5 AI SOAP notes / month", "Appointment calendar", "Basic income tracking"].map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{f}</li>
                ))}
              </ul>
              <Button asChild variant="outline" size="lg" className="mt-8 w-full"><Link to="/signup">Get started free</Link></Button>
            </div>

            <div className="relative rounded-3xl border-2 border-primary bg-surface p-8 shadow-card">
              <span className="absolute -top-3 left-8 rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
              <div className="text-lg font-bold">Premium</div>
              <div className="mt-3 flex items-baseline gap-1">
                <div className="text-5xl font-bold">$29</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">For a serious mobile practice.</p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Unlimited patients",
                  "Unlimited AI SOAP notes",
                  "AI Business Assistant",
                  "Recurring appointments & reminders",
                  "Advanced income & expense tracking",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{f}</li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 w-full gradient-primary text-primary-foreground">
                <Link to="/signup">Start with Premium</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Give yourself back a few hours a week.</h2>
        <p className="mt-3 text-muted-foreground">Join foot care nurses who've replaced paper charts and spreadsheets with ClinSole AI.</p>
        <Button asChild size="lg" className="mt-6 gradient-primary text-primary-foreground">
          <Link to="/signup">Create your free account <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </section>

      <footer className="border-t bg-surface py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-muted-foreground md:flex-row lg:px-8">
          <Brand size="sm" />
          <div>© {new Date().getFullYear()} ClinSole AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
