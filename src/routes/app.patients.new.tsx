import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, PLAN_LIMITS } from "@/lib/store";
import { useState } from "react";
import { ArrowLeft, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/patients/new")({ component: NewPatient });

function NewPatient() {
  const nav = useNavigate();
  const { addPatient, nurse, patients } = useStore();
  const limit = PLAN_LIMITS[nurse?.plan || "free"].patients;
  const atLimit = patients.length >= limit;

  const [f, setF] = useState({
    name: "", phone: "", email: "", address: "", dob: "",
    conditions: "", diabetesStatus: "none" as "none" | "type1" | "type2" | "prediabetes",
    allergies: "", notes: "",
  });

  return (
    <AppShell
      title="Add patient"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/patients"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
      }
    >
      <Container className="max-w-2xl py-6">
        {atLimit && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent/60 p-4">
            <Crown className="mt-0.5 h-5 w-5 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">You've reached the Free plan limit</div>
              <div className="text-muted-foreground">Upgrade to Premium for unlimited patients.</div>
            </div>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/app/subscription">Upgrade</Link>
            </Button>
          </div>
        )}

        <form
          className="space-y-4 rounded-3xl border bg-surface p-6 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            const p = addPatient({
              name: f.name, phone: f.phone, email: f.email, address: f.address, dob: f.dob,
              conditions: f.conditions.split(",").map((s) => s.trim()).filter(Boolean),
              diabetesStatus: f.diabetesStatus, allergies: f.allergies, notes: f.notes,
            });
            if (!p) {
              toast.error("Free plan limit reached. Upgrade to add more patients.");
              return;
            }
            toast.success("Patient added");
            nav({ to: "/app/patients/$id", params: { id: p.id } });
          }}
        >
          <Field label="Full name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Date of birth"><Input type="date" required value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Diabetes status">
              <Select value={f.diabetesStatus} onValueChange={(v: any) => setF({ ...f, diabetesStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="prediabetes">Prediabetes</SelectItem>
                  <SelectItem value="type1">Type 1</SelectItem>
                  <SelectItem value="type2">Type 2</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Medical conditions" hint="Comma-separated (e.g. Hypertension, Neuropathy)">
            <Input value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} />
          </Field>
          <Field label="Allergies"><Input value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} placeholder="Penicillin, latex, etc." /></Field>
          <Field label="Notes"><Textarea rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <Button type="submit" size="lg" disabled={atLimit} className="w-full gradient-primary text-primary-foreground">Save patient</Button>
        </form>
      </Container>
    </AppShell>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
