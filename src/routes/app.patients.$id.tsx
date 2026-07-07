import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore, type DiabetesStatus } from "@/lib/store";
import { format } from "date-fns";
import { ArrowLeft, CalendarPlus, ClipboardPlus, Mail, MapPin, Pencil, Phone, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/patients/$id")({ component: PatientProfile });

function PatientProfile() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { patients, ageOf, updatePatient, deletePatient } = useStore();
  const p = patients.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  if (!p) throw notFound();

  const initials = p.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
  const age = ageOf(p.dob);

  return (
    <AppShell
      title="Patient"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/patients"><ArrowLeft className="mr-1 h-4 w-4" />All patients</Link>
        </Button>
      }
    >
      <div className="gradient-hero text-primary-foreground">
        <Container className="py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-2xl font-bold">{initials}</div>
              <div className="min-w-0">
                <div className="truncate text-2xl font-bold">{p.name}</div>
                <div className="text-sm opacity-85">{age} years old · DOB {p.dob ? format(new Date(p.dob), "MMM d, yyyy") : "—"}</div>
                {p.diabetesStatus !== "none" && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                    <ShieldAlert className="h-3 w-3" />Diabetes: {p.diabetesStatus.replace("type", "Type ")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/25">
                <Link to="/app/soap" search={{ patientId: p.id } as never}><ClipboardPlus className="mr-1 h-4 w-4" />New SOAP</Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/25">
                <Link to="/app/calendar"><CalendarPlus className="mr-1 h-4 w-4" />Book</Link>
              </Button>
              <Button
                variant="secondary"
                className="bg-white/15 text-primary-foreground hover:bg-white/25"
                onClick={() => setEditing(true)}
              >
                <Pencil className="mr-1 h-4 w-4" />Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" className="bg-destructive/80 text-destructive-foreground hover:bg-destructive">
                    <Trash2 className="mr-1 h-4 w-4" />Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this patient?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes {p.name} and their record from your practice.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        await deletePatient(p.id);
                        toast.success("Patient deleted");
                        nav({ to: "/app/patients" });
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm md:grid-cols-3">
            {p.phone && <div className="flex items-center gap-2 opacity-90"><Phone className="h-4 w-4" />{p.phone}</div>}
            {p.email && <div className="flex items-center gap-2 opacity-90"><Mail className="h-4 w-4" />{p.email}</div>}
            {p.address && <div className="flex items-center gap-2 opacity-90"><MapPin className="h-4 w-4" />{p.address}</div>}
          </div>
        </Container>
      </div>

      <Container className="py-6">
        {editing ? (
          <EditForm
            patient={p}
            onCancel={() => setEditing(false)}
            onSave={async (values) => {
              await updatePatient(p.id, values);
              toast.success("Patient updated");
              setEditing(false);
            }}
          />
        ) : (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Visit history</TabsTrigger>
              <TabsTrigger value="assess">Assessments</TabsTrigger>
              <TabsTrigger value="treat">Treatments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card title="Medical conditions">
                <div className="flex flex-wrap gap-2">
                  {p.conditions.length ? p.conditions.map((c) => (
                    <Badge key={c} variant="secondary" className="rounded-full">{c}</Badge>
                  )) : <div className="text-sm text-muted-foreground">None recorded.</div>}
                </div>
              </Card>
              <Card title="Allergies">
                <p className="text-sm">{p.allergies || <span className="text-muted-foreground">None recorded.</span>}</p>
              </Card>
              <Card title="Notes" className="lg:col-span-2">
                <p className="text-sm text-muted-foreground">{p.notes || "No notes yet."}</p>
              </Card>
              {p.nextFollowUp && (
                <Card title="Next follow-up" className="lg:col-span-2">
                  <div className="text-sm font-medium">{format(new Date(p.nextFollowUp), "EEEE, MMM d yyyy")}</div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-2">
              {p.treatments.length === 0 && <Empty text="No visit history yet." />}
              {p.treatments.map((t) => (
                <div key={t.id} className="rounded-2xl border bg-surface p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{format(new Date(t.date), "MMM d, yyyy")}</div>
                    <Badge variant="outline">${t.fee}</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div><b className="text-foreground">A:</b> {t.soap.a}</div>
                    <div><b className="text-foreground">P:</b> {t.soap.p}</div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="assess" className="mt-4 space-y-2">
              {p.assessments.length === 0 && <Empty text="No foot assessments recorded." />}
              {p.assessments.map((a) => (
                <div key={a.id} className="rounded-2xl border bg-surface p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{format(new Date(a.date), "MMM d, yyyy")}</div>
                    <RiskBadge risk={a.risk} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="treat" className="mt-4 space-y-2">
              {p.treatments.length === 0 && <Empty text="No treatments yet." />}
              {p.treatments.map((t) => (
                <div key={t.id} className="rounded-2xl border bg-surface p-4 shadow-soft">
                  <div className="mb-2 text-sm font-semibold">{format(new Date(t.date), "MMM d, yyyy")}</div>
                  <div className="space-y-1 text-sm">
                    <div><b>S:</b> {t.soap.s}</div>
                    <div><b>O:</b> {t.soap.o}</div>
                    <div><b>A:</b> {t.soap.a}</div>
                    <div><b>P:</b> {t.soap.p}</div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </Container>
    </AppShell>
  );
}

type EditableFields = {
  name: string; phone: string; email: string; address: string; dob: string;
  conditions: string[]; diabetesStatus: DiabetesStatus; allergies: string; notes: string;
};

function EditForm({
  patient, onCancel, onSave,
}: {
  patient: EditableFields;
  onCancel: () => void;
  onSave: (v: EditableFields) => Promise<void>;
}) {
  const [f, setF] = useState({
    name: patient.name,
    phone: patient.phone,
    email: patient.email || "",
    address: patient.address,
    dob: patient.dob,
    conditions: patient.conditions.join(", "),
    diabetesStatus: patient.diabetesStatus,
    allergies: patient.allergies,
    notes: patient.notes,
  });
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4 rounded-3xl border bg-surface p-6 shadow-soft"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave({
          name: f.name, phone: f.phone, email: f.email, address: f.address, dob: f.dob,
          conditions: f.conditions.split(",").map((s) => s.trim()).filter(Boolean),
          diabetesStatus: f.diabetesStatus, allergies: f.allergies, notes: f.notes,
        });
        setBusy(false);
      }}
    >
      <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Edit patient</div>
      <Field label="Full name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Date of birth"><Input type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Diabetes status">
          <Select value={f.diabetesStatus} onValueChange={(v: DiabetesStatus) => setF({ ...f, diabetesStatus: v })}>
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
      <Field label="Medical conditions" hint="Comma-separated">
        <Input value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} />
      </Field>
      <Field label="Allergies"><Input value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} /></Field>
      <Field label="Notes"><Textarea rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy} className="flex-1 gradient-primary text-primary-foreground">
          {busy ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-surface p-4 shadow-soft ${className || ""}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-success/15 text-success",
    medium: "bg-warning/20 text-warning-foreground",
    high: "bg-destructive/15 text-destructive",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${map[risk]}`}>{risk} risk</span>;
}
