import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Check, Crown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export const Route = createFileRoute("/app/subscription")({ component: Subscription });

function Subscription() {
  const nav = useNavigate();
  const { nurse, upgradeToPremium, signOut } = useStore();
  const daysLeft = nurse ? Math.max(0, differenceInDays(new Date(nurse.trialEndsAt), new Date())) : 0;

  return (
    <AppShell
      title="Subscription"
      right={<button onClick={() => nav({ to: "/app/dashboard" })} className="text-muted-foreground"><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="px-5 pt-4">
        <div className="rounded-3xl border bg-surface p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground"><Crown className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-lg font-bold capitalize">{nurse?.plan}</div>
            </div>
          </div>
          {nurse?.plan === "trial" && (
            <div className="mt-4 rounded-xl bg-accent px-3 py-2 text-sm">
              <b>{daysLeft} days</b> remaining in your free trial.
            </div>
          )}
        </div>

        <PlanCard
          highlighted
          title="Premium"
          price="$29"
          period="/month"
          features={[
            "Unlimited patients & visit notes",
            "Unlimited AI SOAP notes",
            "AI business assistant",
            "Recurring appointments & reminders",
            "Income & expense tracking",
            "Priority email support",
          ]}
          cta={nurse?.plan === "premium" ? "Current plan" : "Upgrade to Premium"}
          disabled={nurse?.plan === "premium"}
          onClick={() => { upgradeToPremium(); toast.success("You're on Premium — thank you!"); }}
        />

        <PlanCard
          title="Free trial"
          price="$0"
          period=" · 14 days"
          features={["All Premium features", "Up to 25 patients", "20 AI generations / month"]}
          cta="Included"
          disabled
        />

        <p className="mt-6 text-center text-xs text-muted-foreground">Cancel anytime. Prices in CAD.</p>

        <Button
          variant="ghost"
          className="mt-8 w-full text-muted-foreground"
          onClick={() => { signOut(); nav({ to: "/" }); }}
        >Sign out</Button>
      </div>
    </AppShell>
  );
}

function PlanCard({ title, price, period, features, cta, onClick, disabled, highlighted }: any) {
  return (
    <div className={`mt-4 rounded-3xl border p-5 shadow-soft ${highlighted ? "border-primary bg-surface" : "bg-surface"}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-lg font-bold">{title}</div>
        {highlighted && <span className="rounded-full gradient-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Most popular</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-3xl font-bold">{price}</div>
        <div className="text-sm text-muted-foreground">{period}</div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {features.map((f: string) => (
          <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{f}</li>
        ))}
      </ul>
      <Button
        disabled={disabled}
        onClick={onClick}
        className={`mt-5 w-full ${highlighted ? "gradient-primary text-primary-foreground" : ""}`}
        variant={highlighted ? "default" : "outline"}
      >{cta}</Button>
    </div>
  );
}
