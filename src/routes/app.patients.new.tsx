import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/patients/new")({ component: NewPatient });

function NewPatient() {
  const nav = useNavigate();
  const { addPatient } = useStore();
  const [f, setF] = useState({ name: "", age: 70, phone: "", address: "", conditions: "", notes: "" });

  return (
    <AppShell
      title="Add patient"
      right={
        <Link to="/app/patients" className="text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /></Link>
      }
    >
      <form
        className="space-y-4 px-5 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const p = addPatient({
            name: f.name,
            age: f.age,
            phone: f.phone,
            address: f.address,
            conditions: f.conditions.split(",").map((s) => s.trim()).filter(Boolean),
            notes: f.notes,
          });
          toast.success("Patient added");
          nav({ to: "/app/patients/$id", params: { id: p.id } });
        }}
      >
        <Field label="Full name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age"><Input type="number" value={f.age} onChange={(e) => setF({ ...f, age: Number(e.target.value) })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
        <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Medical conditions" hint="Comma-separated (e.g. Diabetes, Neuropathy)">
          <Input value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} />
        </Field>
        <Field label="Notes"><Textarea rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <Button type="submit" size="lg" className="w-full gradient-primary text-primary-foreground">Save patient</Button>
      </form>
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
