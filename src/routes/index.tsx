import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Check,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { FeaturedShowcase, type ShowcaseItem } from "@/components/landing/FeaturedShowcase";
import { ImageStage } from "@/components/landing/ImageStage";
import { ProfileCard, StatusDot, type Profile } from "@/components/landing/ProfileCard";
import { Reveal } from "@/components/landing/Reveal";
import { ServiceCard } from "@/components/landing/ServiceCard";
import { SupportBand } from "@/components/landing/SupportBand";
import { HERO_SCENES, PROFILE_SCENES, SERVICE_SCENES, SUPPORT_SCENE } from "@/lib/landing-media";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClinSole AI — Practice Assistant for Foot Care Nurses" },
      { name: "description", content: "The complete practice assistant for independent foot care nurses. Manage patients, generate AI SOAP notes, schedule visits, and grow your mobile practice." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: HeartPulse, title: "AI SOAP Notes", desc: "Turn quick visit notes into full clinical documentation in seconds.", scene: SERVICE_SCENES.soap },
  { icon: Users, title: "Patient records", desc: "Medical history, diabetes status, allergies, assessments, and treatment history.", scene: SERVICE_SCENES.patients },
  { icon: Calendar, title: "Smart scheduling", desc: "Book visits, set recurring appointments, and send patient reminders.", scene: SERVICE_SCENES.scheduling },
  { icon: Wallet, title: "Income tracking", desc: "Log visits, payments, and expenses. See monthly revenue at a glance.", scene: SERVICE_SCENES.income },
  { icon: Sparkles, title: "AI Business Assistant", desc: "Generate follow-ups, education handouts, and marketing content.", scene: SERVICE_SCENES.assistant },
  { icon: ShieldCheck, title: "Secure & private", desc: "Your patient data is encrypted and stays private to your practice.", scene: SERVICE_SCENES.privacy },
];

/* Illustrative practice profiles — the shapes of practice ClinSole is built
   around, not real practitioners. */
const PROFILES: Profile[] = [
  {
    id: "mobile",
    role: "Mobile foot care nurse",
    setting: "Home visits, five days a week",
    status: "Accepting new patients",
    summary: "Runs a full round of home visits and writes every note up before leaving the driveway.",
    scene: PROFILE_SCENES.mobile,
  },
  {
    id: "clinic",
    role: "Clinic-based RN",
    setting: "Fixed clinic, back-to-back appointments",
    status: "Booking three weeks out",
    summary: "Sees patients on a tight schedule and needs the last visit's history on screen in seconds.",
    scene: PROFILE_SCENES.clinic,
  },
  {
    id: "residences",
    role: "Long-term care contractor",
    setting: "Care homes and residences",
    status: "Serving four residences",
    summary: "Works a standing rotation across residences, with recurring visits and per-site invoicing.",
    scene: PROFILE_SCENES.residences,
  },
];

const SHOWCASE: ShowcaseItem[] = [
  {
    id: "mobile",
    role: "Mobile foot care nurse",
    setting: "Home visits, five days a week",
    status: "Accepting new patients",
    summary:
      "Eight visits a day across three towns. The drive between them is where the paperwork used to pile up — now the note is finished before the next address goes into the sat nav.",
    highlights: [
      "Dictate the visit, get a structured SOAP note back",
      "Photos attach to the right foot, the right zone, the right visit",
      "Next appointment booked from the same screen",
    ],
    scene: PROFILE_SCENES.mobile,
  },
  {
    id: "clinic",
    role: "Clinic-based RN",
    setting: "Fixed clinic, back-to-back appointments",
    status: "Booking three weeks out",
    summary:
      "Twenty-minute slots leave no room to hunt for history. The patient record opens on what changed since last time, so the assessment starts with the full picture.",
    highlights: [
      "Risk score and referral flags surfaced on arrival",
      "Zone-by-zone trends across previous visits",
      "Recurring nail care visits scheduled in one pass",
    ],
    scene: PROFILE_SCENES.clinic,
  },
  {
    id: "residences",
    role: "Long-term care contractor",
    setting: "Care homes and residences",
    status: "Serving four residences",
    summary:
      "A standing rotation across four sites, each with its own billing. Visits repeat on a schedule and the month totals itself up without a spreadsheet.",
    highlights: [
      "Recurring rounds set once and repeated",
      "Income and expenses tracked per site",
      "Handouts and follow-up letters drafted in seconds",
    ],
    scene: PROFILE_SCENES.residences,
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-8">
          <Brand size="sm" />
          <div className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors duration-300 hover:text-foreground">Features</a>
            <a href="#practices" className="transition-colors duration-300 hover:text-foreground">Practices</a>
            <a href="#pricing" className="transition-colors duration-300 hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — the imagery drifts and crossfades behind a scrim; everything
          the visitor came to click stays exactly where they found it. */}
      <section className="relative overflow-hidden text-primary-foreground">
        <ImageStage scenes={HERO_SCENES} className="absolute inset-0" />
        <div className="gradient-hero absolute inset-0 opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/10" />

        <div className="relative mx-auto max-w-6xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-widest uppercase backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" /> Built for independent foot care nurses
                </div>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight lg:text-6xl">
                  Your entire foot care practice, powered by AI.
                </h1>
              </Reveal>
              <Reveal delay={170}>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 lg:text-lg">
                  ClinSole AI is the modern practice assistant for mobile foot care nurses. Document visits with AI SOAP notes, manage patients, schedule follow-ups, and track your income — all in one place.
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
                    <Link to="/login">I have an account</Link>
                  </Button>
                </div>
                <div className="mt-6 text-xs opacity-80">No credit card required · Free plan available forever</div>
              </Reveal>
            </div>

            {/* Fixed panel over moving imagery. It fades in once and then holds
                still — nothing here shifts under the pointer. */}
            <Reveal delay={330} className="hidden lg:block">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-card backdrop-blur-md">
                <div className="flex items-center justify-between text-xs tracking-widest text-white/70 uppercase">
                  Today
                  <span className="inline-flex items-center gap-2 text-white/90 normal-case">
                    <StatusDot /> 3 visits
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { time: "09:15", label: "Diabetic foot assessment", place: "Home visit" },
                    { time: "11:00", label: "Routine nail care", place: "Clinic" },
                    { time: "14:30", label: "Wound review · follow-up", place: "Residence" },
                  ].map((visit) => (
                    <div key={visit.time} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                      <div className="text-sm font-semibold tabular-nums">{visit.time}</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{visit.label}</div>
                        <div className="text-xs text-white/70">{visit.place}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-white/70">Two notes still to write · ClinSole drafts both</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <Reveal className="max-w-2xl">
          <div className="text-xs font-semibold tracking-widest text-primary uppercase">Everything you need</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Built specifically for foot care nurses.</h2>
          <p className="mt-3 text-muted-foreground">Not another generic EMR. ClinSole AI is designed around how mobile foot care actually works — from diabetic assessments to recurring nail care visits.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 80} variant="media">
              <ServiceCard
                icon={feature.icon}
                title={feature.title}
                description={feature.desc}
                scene={feature.scene}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Practice profiles */}
      <section id="practices" className="bg-surface-muted py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">Who it's for</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Three shapes of practice. One assistant.</h2>
            <p className="mt-3 text-muted-foreground">Illustrative profiles, not real practitioners — but the working days behind them are the ones ClinSole AI was designed around.</p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILES.map((profile, i) => (
              <Reveal key={profile.id} delay={i * 90} variant="media">
                <ProfileCard profile={profile} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20 max-w-2xl">
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">A closer look</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">A day in each practice.</h2>
          </Reveal>

          <Reveal className="mt-8" delay={80}>
            <FeaturedShowcase items={SHOWCASE} />
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <Reveal className="text-center">
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">Simple pricing</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Start free. Upgrade when you're ready.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal delay={80}>
              <div className="clin-card h-full rounded-3xl border bg-surface p-8 shadow-soft hover:shadow-card">
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
            </Reveal>

            <Reveal delay={170}>
              <div className="clin-card relative h-full rounded-3xl border-2 border-primary bg-surface p-8 shadow-card">
                <span className="gradient-primary absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
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
                <Button asChild size="lg" className="gradient-primary mt-8 w-full text-primary-foreground">
                  <Link to="/signup">Start with Premium</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Support */}
      <SupportBand
        scene={SUPPORT_SCENE}
        eyebrow="Support"
        title="Need help now?"
        body="Import your patient list, set up your first week of visits, or get a note reviewed — a real person answers, and setup help is included on every plan, including the free one."
      >
        <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
          <Link to="/signup">Get set up free <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
          <a href="mailto:support@clinsole.ai">Talk to support</a>
        </Button>
      </SupportBand>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Give yourself back a few hours a week.</h2>
          <p className="mt-3 text-muted-foreground">Join foot care nurses who've replaced paper charts and spreadsheets with ClinSole AI.</p>
          <Button asChild size="lg" className="gradient-primary mt-6 text-primary-foreground">
            <Link to="/signup">Create your free account <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </Reveal>
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
