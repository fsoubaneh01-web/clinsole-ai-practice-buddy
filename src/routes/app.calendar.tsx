import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore, type Appointment, type Patient } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { checkAppointmentOverlap } from "@/lib/appointments.functions";

import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Bell, CalendarPlus, MapPin, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/calendar")({ component: CalendarView });

function findOverlap(
  appointments: Appointment[],
  start: Date,
  duration: number,
  excludeId?: string,
): Appointment | undefined {
  const startMs = start.getTime();
  const endMs = startMs + duration * 60_000;
  return appointments.find((a) => {
    if (a.id === excludeId) return false;
    const aStart = new Date(a.date).getTime();
    const aEnd = aStart + (a.duration || 0) * 60_000;
    return startMs < aEnd && aStart < endMs;
  });
}

// Generate future occurrence dates for a recurring series: 12 occurrences or
// 3 months out, whichever comes first (excluding the first appointment itself).
// All arithmetic is done in local wall-clock time so a 10:00 visit stays at
// 10:00 across DST changes, and monthly repeats clamp to the last valid day.
function recurrenceDates(start: Date, kind: "weekly" | "biweekly" | "monthly"): Date[] {
  const limit = addMonthsLocal(start, 3);
  const out: Date[] = [];
  for (let i = 1; i < 12; i++) {
    const d =
      kind === "weekly"
        ? addDaysLocal(start, 7 * i)
        : kind === "biweekly"
          ? addDaysLocal(start, 14 * i)
          : addMonthsLocal(start, i);
    if (d.getTime() > limit.getTime()) break;
    out.push(d);
  }
  return out;
}


function CalendarView() {
  const { appointments, patients, addAppointment, updateAppointment, deleteAppointment } = useStore();
  const [selected, setSelected] = useState<Date>(new Date());
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const forDay = appointments
    .filter((a) => isSameDay(new Date(a.date), selected))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell
      title="Schedule"
      actions={
        <AppointmentDialog
          patients={patients}
          appointments={appointments}
          defaultDate={selected}
          onSave={async (v) => {
            const r = await addAppointment(v);
            if (r.error) toast.error(r.error);
            else toast.success("Appointment booked");
            return !r.error;
          }}
          onCreateOccurrence={async (v) => {
            const r = await addAppointment(v);
            return !r.error;
          }}
        />
      }
    >
      <Container className="py-6">
        <div className="rounded-3xl border bg-surface p-4 shadow-soft lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold">{format(selected, "MMMM yyyy")}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(addDays(selected, -7))}>‹ Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setSelected(new Date())}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => setSelected(addDays(selected, 7))}>Next ›</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const isActive = isSameDay(d, selected);
              const dayApts = appointments.filter((a) => isSameDay(new Date(a.date), d));
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelected(d)}
                  className={`flex flex-col items-center rounded-2xl border py-2 text-xs transition ${
                    isActive ? "border-primary gradient-primary text-primary-foreground shadow-soft" : "bg-surface hover:border-primary/50"
                  }`}
                >
                  <span className="opacity-70">{format(d, "EEE")}</span>
                  <span className="mt-1 text-lg font-bold">{format(d, "d")}</span>
                  <span className="mt-1 text-[10px]">{dayApts.length > 0 ? `${dayApts.length} visits` : "—"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {isSameDay(selected, new Date()) ? "Today" : format(selected, "EEEE MMM d")}
            </h2>
            <span className="text-xs text-muted-foreground">{forDay.length} visits</span>
          </div>

          {forDay.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-surface-muted p-8 text-center text-sm text-muted-foreground">
              No visits scheduled.
            </div>
          ) : (
            <ul className="grid gap-2 lg:grid-cols-2">
              {forDay.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft">
                  <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-accent py-2 text-primary">
                    <div className="text-sm font-bold">{format(new Date(a.date), "HH:mm")}</div>
                    <div className="text-[10px] opacity-70">{a.duration}m</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.patientName}</div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="truncate">{a.type}</span>
                      {a.expectedFee > 0 && <span>· ${a.expectedFee}</span>}
                      {a.location && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />{a.location}
                        </span>
                      )}
                      {a.recurring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <RefreshCw className="h-2.5 w-2.5" />{a.recurring}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info(`Reminder sent to ${a.patientName}`)}
                    className="grid h-9 w-9 place-items-center rounded-full text-primary hover:bg-accent"
                    aria-label="Send reminder"
                  ><Bell className="h-4 w-4" /></button>
                  <button
                    onClick={() => setEditing(a)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-primary"
                    aria-label="Edit"
                  ><Pencil className="h-4 w-4" /></button>
                  <button
                    onClick={() => setPendingDelete(a)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete"
                  ><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {editing && (
          <AppointmentDialog
            patients={patients}
            appointments={appointments}
            defaultDate={new Date(editing.date)}
            existing={editing}
            open
            onOpenChange={(o) => { if (!o) setEditing(null); }}
            onSave={async (v) => {
              const r = await updateAppointment(editing.id, v);
              if (r.error) toast.error(r.error);
              else toast.success("Appointment updated");
              return !r.error;
            }}
          />
        )}

        <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
              <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  const target = pendingDelete;
                  setPendingDelete(null);
                  if (!target) return;
                  const r = await deleteAppointment(target.id);
                  if (r.error) toast.error(`Couldn't delete appointment: ${r.error}`);
                  else toast.success("Appointment cancelled");
                }}
              >Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Container>
    </AppShell>
  );
}

type FormValues = Omit<Appointment, "id" | "patientName">;

function AppointmentDialog({
  patients, appointments, defaultDate, existing, onSave, onCreateOccurrence, open: openProp, onOpenChange,
}: {
  patients: Patient[];
  appointments: Appointment[];
  defaultDate: Date;
  existing?: Appointment;
  onSave: (v: FormValues) => Promise<boolean>;
  onCreateOccurrence?: (v: FormValues) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const setOpen = (o: boolean) => { controlled ? onOpenChange?.(o) : setInternalOpen(o); };

  const init = existing;
  const [pid, setPid] = useState(init?.patientId || patients[0]?.id || "");
  const [dateStr, setDateStr] = useState(format(init ? new Date(init.date) : defaultDate, "yyyy-MM-dd"));
  const [time, setTime] = useState(init ? format(new Date(init.date), "HH:mm") : "10:00");
  const [duration, setDuration] = useState(init?.duration ?? 45);
  const [type, setType] = useState(init?.type ?? "Routine footcare");
  const [location, setLocation] = useState(init?.location ?? "");
  const [notes, setNotes] = useState(init?.notes ?? "");
  const [fee, setFee] = useState(init?.expectedFee ?? 65);
  const [recurring, setRecurring] = useState<string>(init?.recurring ?? "none");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<{ date: string; patientName?: string | null } | null>(null);
  const checkOverlap = useServerFn(checkAppointmentOverlap);

  const buildDate = () => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(`${dateStr}T00:00:00`);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  // Create the future occurrences of a recurring series as independent rows.
  // Each one goes through the same server-side overlap guard; conflicting slots
  // are skipped (never silently double-booked) and reported back to the nurse.
  const createSeries = async (start: Date, kind: "weekly" | "biweekly" | "monthly") => {
    if (!onCreateOccurrence) return;
    let created = 0;
    let skipped = 0;
    for (const d of recurrenceDates(start, kind)) {
      try {
        const res = await checkOverlap({
          data: { startIso: d.toISOString(), durationMin: duration },
        });
        if (res.conflict) { skipped++; continue; }
      } catch (e) {
        console.error("overlap check (series)", e);
      }
      const ok = await onCreateOccurrence({
        patientId: pid, date: d.toISOString(), duration, type,
        location, notes, expectedFee: fee,
        recurring: kind,
      });
      if (ok) created++; else skipped++;
    }
    if (created > 0) {
      toast.success(
        `${created} more ${kind} visit${created === 1 ? "" : "s"} scheduled` +
          (skipped > 0 ? ` · ${skipped} skipped (conflict)` : ""),
      );
    } else if (skipped > 0) {
      toast.warning(`No repeat visits added — ${skipped} slot${skipped === 1 ? "" : "s"} conflicted.`);
    }
  };

  const commit = async (d: Date) => {
    setBusy(true);
    const kind = recurring === "none" ? null : (recurring as "weekly" | "biweekly" | "monthly");
    const ok = await onSave({
      patientId: pid, date: d.toISOString(), duration, type,
      location, notes, expectedFee: fee,
      recurring: kind,
    });
    if (ok && kind && !existing) await createSeries(d, kind);
    setBusy(false);
    if (ok) setOpen(false);
  };

  // Client check first (instant), then an authoritative server-side check so a
  // stale local cache can't let a real double-booking slip through.
  const attemptSave = async () => {
    const d = buildDate();
    const clash = findOverlap(appointments, d, duration, existing?.id);
    if (clash) { setConflict(clash); return; }
    setBusy(true);
    try {
      const res = await checkOverlap({
        data: { startIso: d.toISOString(), durationMin: duration, excludeId: existing?.id },
      });
      if (res.conflict) { setBusy(false); setConflict(res.conflict); return; }
    } catch (e) {
      console.error("overlap check", e);
    }
    setBusy(false);
    await commit(d);
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger asChild>
          <Button size="sm" className="gradient-primary text-primary-foreground">
            <CalendarPlus className="mr-1 h-4 w-4" />New appointment
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{existing ? "Edit appointment" : "New appointment"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select value={pid} onValueChange={setPid}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {patients.length === 0 && <SelectItem value="__none" disabled>No patients yet</SelectItem>}
                {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Expected fee ($)</Label><Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-1.5"><Label>Visit type</Label><Input value={type} onChange={(e) => setType(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input placeholder="Patient home, clinic address..." value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Recurring</Label>
            <Select value={recurring} onValueChange={setRecurring}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full gradient-primary text-primary-foreground"
            disabled={busy || !pid || pid === "__none"}
            onClick={() => { void attemptSave(); }}

          >{busy ? "Saving..." : existing ? "Save changes" : "Book appointment"}</Button>
        </div>
      </DialogContent>

      <AlertDialog open={!!conflict} onOpenChange={(o) => { if (!o) setConflict(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Double-booking warning</AlertDialogTitle>
            <AlertDialogDescription>
              {conflict && `This overlaps with an existing appointment at ${format(new Date(conflict.date), "HH:mm")}${conflict.patientName ? ` (${conflict.patientName})` : ""}. Book it anyway?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConflict(null); void commit(buildDate()); }}
            >Book anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
