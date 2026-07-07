import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/subscription")({ component: Subscription });

function Subscription() {
  const nav = useNavigate();
  const { nurse, upgradeToPremium, signOut } = useStore();

  return (
    <AppShell title="Subscription">
      <Container className="max-w-4xl py-8">
        <div className="rounded-3xl border bg-surface p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground"><Crown className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-xl font-bold capitalize">{nurse?.plan}</div>
            </div>
            {nurse?.plan === "premium" && (
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Active</span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PlanCard
            title="Free"
            price="$0"
            period="forever"
            features={[
              "Up to 10 patients",
              "5 AI SOAP notes / month",
              "Appointment calendar",
              "Basic income tracking",
            ]}
            cta={nurse?.plan === "free" ? "Current plan" : "Downgrade"}
            disabled
          />
          <PlanCard
            highlighted
            title="Premium"
            price="$29"
            period="/month"
            features={[
              "Unlimited patients",
              "Unlimited AI SOAP notes",
              "AI business assistant",
              "Recurring appointments & reminders",
              "Advanced income & expense tracking",
              "Priority support",
            ]}
            cta={nurse?.plan === "premium" ? "Current plan" : "Upgrade to Premium"}
            disabled={nurse?.plan === "premium"}
            onClick={() => { upgradeToPremium(); toast.success("Welcome to Premium!"); }}
          />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Cancel anytime. Prices in USD.</p>

        <div className="mt-10 border-t pt-6">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account</div>
          <div className="rounded-2xl border bg-surface p-5 shadow-soft">
            <div className="space-y-2 text-sm">
              <Row label="Name" value={nurse?.name || "—"} />
              <Row label="Email" value={nurse?.email || "—"} />
              <Row label="Credentials" value={nurse?.credentials || "—"} />
              <Row label="Service area" value={nurse?.serviceArea || "—"} />
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => { signOut(); nav({ to: "/" }); }}
            >Sign out</Button>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PlanCard({ title, price, period, features, cta, onClick, disabled, highlighted }: any) {
  return (
    <div className={`rounded-3xl border p-6 shadow-soft ${highlighted ? "border-primary bg-surface ring-2 ring-primary/20" : "bg-surface"}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-lg font-bold">{title}</div>
        {highlighted && <span className="rounded-full gradient-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Recommended</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-4xl font-bold">{price}</div>
        <div className="text-sm text-muted-foreground">{period}</div>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f: string) => (
          <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{f}</li>
        ))}
      </ul>
      <Button
        disabled={disabled}
        onClick={onClick}
        className={`mt-6 w-full ${highlighted ? "gradient-primary text-primary-foreground" : ""}`}
        variant={highlighted ? "default" : "outline"}
      >{cta}</Button>
    </div>
  );
}
