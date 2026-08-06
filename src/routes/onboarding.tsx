import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  const nav = useNavigate();
  const { nurse, setNurse, session } = useStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: nurse?.name || "",
    credentials: nurse?.credentials || "RN, Advanced Foot Care Certified",
    serviceArea: nurse?.serviceArea || "",
    yearsExperience: nurse?.yearsExperience || 5,
    bio: nurse?.bio || "",
  });

  const submit = async () => {
    await setNurse({
      ...form,
      email: nurse?.email || session?.user?.email || "",
      plan: nurse?.plan || "free",
      aiUsedThisMonth: nurse?.aiUsedThisMonth || 0,
    });
    nav({ to: "/app/dashboard" });
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background px-6 pt-10 pb-10">
      <Brand />
      <div className="mt-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Tell us about you</h2>
            <p className="mt-1 text-sm text-muted-foreground">This helps personalize your practice.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input placeholder="Sarah Thompson" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Credentials</Label>
              <Input value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} />
            </div>
          </div>
          <Button size="lg" className="w-full gradient-primary text-primary-foreground" disabled={!form.name} onClick={() => setStep(1)}>Continue</Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Your practice</h2>
            <p className="mt-1 text-sm text-muted-foreground">Where do you provide care?</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Service area</Label>
              <Input placeholder="Toronto & GTA" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Years of experience</Label>
              <Input type="number" min={0} value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(0)}>Back</Button>
            <Button size="lg" className="flex-1 gradient-primary text-primary-foreground" onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Short bio</h2>
            <p className="mt-1 text-sm text-muted-foreground">Used in patient communications and marketing.</p>
          </div>
          <Textarea rows={6} placeholder="I'm a Registered Nurse specializing in advanced foot care for older adults and people living with diabetes…" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button size="lg" className="flex-1 gradient-primary text-primary-foreground" onClick={submit}>Enter dashboard</Button>
          </div>
        </div>
      )}
    </div>
  );
}
