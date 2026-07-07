import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const { signIn, onboarded } = useStore();
  const [email, setEmail] = useState("nurse@example.com");
  const [pw, setPw] = useState("demo1234");

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-6 pt-10 pb-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <Brand />
      <h2 className="mt-8 text-2xl font-bold tracking-tight">Welcome back</h2>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your foot care practice.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          signIn(email);
          nav({ to: onboarded ? "/app/dashboard" : "/onboarding" });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="text-right"><a className="text-xs text-primary">Forgot password?</a></div>
        </div>
        <Button type="submit" size="lg" className="w-full gradient-primary text-primary-foreground shadow-card">
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here? <Link to="/signup" className="font-semibold text-primary">Create an account</Link>
      </p>
    </div>
  );
}
