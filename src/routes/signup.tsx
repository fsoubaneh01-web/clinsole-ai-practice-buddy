import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const nav = useNavigate();
  const { signUp } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-6 pt-10 pb-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <Brand />
      <h2 className="mt-8 text-2xl font-bold tracking-tight">Create your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">14 days free · No credit card required</p>

      <ul className="mt-5 space-y-2 rounded-2xl border bg-accent/40 p-4 text-sm">
        {["Unlimited patients & visit notes","AI SOAP note generator","Appointment calendar & reminders","Income tracker & business AI"].map((f) => (
          <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
        ))}
      </ul>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await signUp(email, pw);
          setBusy(false);
          if (error) { toast.error(error); return; }
          toast.success("Account created");
          nav({ to: "/onboarding" });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required placeholder="you@practice.ca" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" required minLength={8} placeholder="At least 8 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" size="lg" disabled={busy} className="w-full gradient-primary text-primary-foreground shadow-card">
          {busy ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already registered? <Link to="/login" className="font-semibold text-primary">Sign in</Link>
      </p>
    </div>
  );
}

