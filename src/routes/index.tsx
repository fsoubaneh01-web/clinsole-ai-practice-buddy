import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { CapabilityRow } from "@/components/landing/CapabilityRow";
import { CareField } from "@/components/landing/CareField";
import { FeaturedShowcase, type ShowcaseItem } from "@/components/landing/FeaturedShowcase";
import { ImageStage } from "@/components/landing/ImageStage";
import { ProfileCard, StatusDot, type Profile } from "@/components/landing/ProfileCard";
import { Reveal } from "@/components/landing/Reveal";
import { WordMark } from "@/components/landing/WordMark";
import { PROFILE_SCENES, SECTION_SCENES } from "@/lib/landing-media";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClinSole AI — Practice Assistant for Foot Care Nurses" },
      { name: "description", content: "The complete practice assistant for independent foot care nurses. Manage patients, generate AI SOAP notes, schedule visits, and grow your mobile practice." },
    ],
  }),
  component: Landing,
});

const SHELL = "mx-auto w-full max-w-[1280px] px-6 lg:px-10";
const SECTION = "py-[72px] lg:py-[120px]";

const CAPABILITIES = [
  { title: "AI SOAP notes", description: "Turn quick visit notes into full clinical documentation in seconds." },
  { title: "Patient records", description: "Medical history, diabetes status, allergies, assessments, and treatment history." },
  { title: "Smart scheduling", description: "Book visits, set recurring appointments, and send patient reminders." },
  { title: "Income tracking", description: "Log visits, payments, and expenses. See monthly revenue at a glance." },
  { title: "Business assistant", description: "Generate follow-ups, education handouts, and marketing content." },
  { title: "Secure & private", description: "Your patient data is encrypted and stays private to your practice." },
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

const FREE_PLAN = ["Up to 10 patients", "5 AI SOAP notes / month", "Appointment calendar", "Basic income tracking"];
const PREMIUM_PLAN = [
  "Unlimited patients",
  "Unlimited AI SOAP notes",
  "AI business assistant",
  "Recurring appointments & reminders",
  "Advanced income & expense tracking",
  "Priority support",
];

function Landing() {
  return (
    <div className="theme-canvas min-h-screen bg-background">
      {/* Nav — one hairline, no fill. The page's single filled control lives
          in the hero, not up here. */}
      <header className="sticky top-0 z-30 border-b border-rule bg-nav/85 backdrop-blur">
        <div className={`${SHELL} flex items-center justify-between py-5`}>
          <WordMark />
          <nav className="hidden gap-9 text-[15px] font-light text-ink-muted md:flex">
            <a href="#capabilities" className="transition-colors duration-300 hover:text-ink">What it does</a>
            <a href="#practices" className="transition-colors duration-300 hover:text-ink">Who it's for</a>
            <a href="#pricing" className="transition-colors duration-300 hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-[15px] font-light text-ink-muted transition-colors duration-300 hover:text-ink">
              Sign in
            </Link>
            <Link to="/signup" className="canvas-link">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero — copy left, drifting node field right. */}
      <section className={SHELL}>
        <div className="grid items-center gap-16 py-[64px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-[104px]">
          <div>
            <Reveal>
              <div className="canvas-eyebrow">Practice assistant for foot care nurses</div>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="canvas-display mt-8 text-[clamp(48px,7.2vw,113px)]">
                Your whole practice, quietly handled.
              </h1>
            </Reveal>
            <Reveal delay={170}>
              <p className="canvas-body mt-8 max-w-xl">
                ClinSole AI is the practice assistant for independent foot care nurses. Document visits with AI SOAP notes, keep patient records in order, schedule follow-ups, and track what you earn — in one place.
              </p>
            </Reveal>
            <Reveal delay={250}>
              <div className="mt-10 flex flex-wrap items-center gap-8">
                <Link to="/signup" className="canvas-pill">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="canvas-link">I have an account</Link>
              </div>
              <div className="mt-8 text-[13px] font-light text-ink-soft">
                No credit card required · Free plan available forever
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} variant="media">
            <CareField />
          </Reveal>
        </div>
      </section>

      {/* Capabilities — visual left, copy right. */}
      <section id="capabilities" className={`${SHELL} ${SECTION}`}>
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal variant="media" className="order-last lg:order-first">
            <ImageStage
              scenes={SECTION_SCENES.capabilities}
              holdMs={9000}
              className="canvas-frame aspect-4/3 w-full"
            />
          </Reveal>

          <Reveal>
            <div className="canvas-eyebrow">Everything you need</div>
            <h2 className="canvas-display mt-7 text-[clamp(38px,4.4vw,68px)]">
              Built specifically for foot care nurses.
            </h2>
            <p className="canvas-body mt-7 max-w-xl">
              Not another generic EMR. ClinSole AI is designed around how mobile foot care actually works — from diabetic assessments to recurring nail care visits.
            </p>
            <div className="mt-9">
              <Link to="/signup" className="canvas-link">
                See what's included <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:mt-28 lg:grid-cols-3">
          {CAPABILITIES.map((capability, i) => (
            <Reveal key={capability.title} delay={i * 80}>
              <CapabilityRow
                index={i + 1}
                title={capability.title}
                description={capability.description}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Practices — copy left, visual right. */}
      <section id="practices" className={`${SHELL} ${SECTION}`}>
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <Reveal>
            <div className="canvas-eyebrow">Who it's for</div>
            <h2 className="canvas-display mt-7 text-[clamp(38px,4.4vw,68px)]">
              Three shapes of practice. One assistant.
            </h2>
            <p className="canvas-body mt-7 max-w-xl">
              Illustrative profiles, not real practitioners — but the working days behind them are the ones ClinSole AI was designed around.
            </p>
          </Reveal>

          <Reveal variant="media" delay={120}>
            <ImageStage
              scenes={SECTION_SCENES.practices}
              holdMs={9000}
              className="canvas-frame aspect-4/3 w-full"
            />
          </Reveal>
        </div>

        <div className="mt-20 grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:mt-28 lg:grid-cols-3">
          {PROFILES.map((profile, i) => (
            <Reveal key={profile.id} delay={i * 90} variant="media">
              <ProfileCard profile={profile} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section className={`${SHELL} pb-[72px] lg:pb-[120px]`}>
        <Reveal className="max-w-2xl">
          <div className="canvas-eyebrow">A closer look</div>
          <h2 className="canvas-display mt-7 text-[clamp(38px,4.4vw,68px)]">A day in each practice.</h2>
        </Reveal>
        <Reveal className="mt-14" delay={80}>
          <FeaturedShowcase items={SHOWCASE} />
        </Reveal>
      </section>

      {/* Pricing — two columns, a hairline between them, one filled button. */}
      <section id="pricing" className={`${SHELL} ${SECTION}`}>
        <Reveal className="max-w-2xl">
          <div className="canvas-eyebrow">Simple pricing</div>
          <h2 className="canvas-display mt-7 text-[clamp(38px,4.4vw,68px)]">
            Start free. Upgrade when you're ready.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-14 md:grid-cols-2 md:gap-0">
          <Reveal delay={80} className="border-t border-rule pt-10 md:pr-16">
            <div className="canvas-eyebrow">Free</div>
            <div className="canvas-display mt-6 text-[56px]">$0</div>
            <div className="mt-2 text-[14px] font-light text-ink-soft">Forever. Perfect for getting started.</div>
            <ul className="mt-9 space-y-3.5">
              {FREE_PLAN.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-[15px] font-light text-ink">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-signal" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link to="/signup" className="canvas-link">Get started free</Link>
            </div>
          </Reveal>

          <Reveal delay={170} className="border-t border-rule pt-10 md:border-l md:pl-16">
            <div className="canvas-eyebrow">Premium</div>
            <div className="canvas-display mt-6 text-[56px]">
              $29<span className="text-[18px] font-light text-ink-soft"> /month</span>
            </div>
            <div className="mt-2 text-[14px] font-light text-ink-soft">For a serious mobile practice.</div>
            <ul className="mt-9 space-y-3.5">
              {PREMIUM_PLAN.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-[15px] font-light text-ink">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-signal" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link to="/signup" className="canvas-pill">
                Start with Premium <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Support — no panel, no fill behind it. Just a rule, the question, and
          one place to press. */}
      <section className={`${SHELL} pb-[72px] lg:pb-[120px]`}>
        <div className="canvas-rule pt-16 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
            <Reveal>
              <div className="flex items-center gap-2">
                <StatusDot />
                <span className="canvas-eyebrow">Support</span>
              </div>
              <h2 className="canvas-display mt-7 text-[clamp(38px,4.8vw,76px)]">Need help now?</h2>
            </Reveal>
            <Reveal delay={110}>
              <p className="canvas-body max-w-md">
                Import your patient list, set up your first week of visits, or get a note reviewed. A real person answers, and setup help is included on every plan — including the free one.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-8">
                <Link to="/signup" className="canvas-link">
                  Get set up free <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a href="mailto:support@clinsole.ai" className="canvas-link">Talk to support</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className={`${SHELL} flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center`}>
          <WordMark />
          <div className="text-[13px] font-light text-ink-soft">
            © {new Date().getFullYear()} ClinSole AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
