import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Bell, CalendarPlus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/calendar")({ component: CalendarView });

function CalendarView() {
  const { appointments, patients, addAppointment, deleteAppointment } = useStore();
  const [selected, setSelected] = useState<Date>(new Date());
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const forDay = appointments
    .filter((a) => isSameDay(new Date(a.date), selected))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell
      title="Schedule"
      right={<NewAppointmentDialog patients={patients} defaultDate={selected} onCreate={addAppointment} />}
    >
      <div className="px-5 pt-4">
        <div className="text-sm font-semibold">{format(selected, "MMMM yyyy")}</div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const isActive = isSameDay(d, selected);
            const hasApt = appointments.some((a) => isSameDay(new Date(a.date), d));
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={`flex flex-col items-center rounded-2xl border py-2 text-xs transition ${
                  isActive ? "border-primary gradient-primary text-primary-foreground shadow-soft" : "bg-surface"
                }`}
              >
                <span className="opacity-70">{format(d, "EEE")[0]}</span>
                <span className="mt-1 text-base font-bold">{format(d, "d")}</span>
                <span className={`mt-1 h-1 w-1 rounded-full ${hasApt ? (isActive ? "bg-white" : "bg-primary") : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </div>

      <section className="px-5 pt-6">
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
          <ul className="space-y-2">
            {forDay.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft">
                <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-accent py-2 text-primary">
                  <div className="text-xs font-medium">{format(new Date(a.date), "HH:mm")}</div>
                  <div className="text-[10px] opacity-70">{a.duration}m</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{a.patientName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{a.type}</span>
                    {a.recurring && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <RefreshCw className="h-2.5 w-2.5" />{a.recurring}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { toast.info(`Reminder sent to ${a.patientName}`); }}
                  className="grid h-9 w-9 place-items-center rounded-full text-primary hover:bg-accent"
                  aria-label="Send reminder"
                ><Bell className="h-4 w-4" /></button>
                <button
                  onClick={() => { deleteAppointment(a.id); toast.success("Appointment cancelled"); }}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete"
                ><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function NewAppointmentDialog({ patients, defaultDate, onCreate }: any) {
  const [open, setOpen] = useState(false);
  const [pid, setPid] = useState(patients[0]?.id || "");
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState("Routine footcare");
  const [duration, setDuration] = useState(45);
  const [recurring, setRecurring] = useState<string>("none");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary text-primary-foreground"><CalendarPlus className="mr-1 h-4 w-4" />Book</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New appointment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select value={pid} onValueChange={setPid}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-1.5"><Label>Visit type</Label><Input value={type} onChange={(e) => setType(e.target.value)} /></div>
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
            onClick={() => {
              const p = patients.find((x: any) => x.id === pid);
              if (!p) return;
              const [h, m] = time.split(":").map(Number);
              const d = new Date(defaultDate); d.setHours(h, m, 0, 0);
              onCreate({
                patientId: p.id, patientName: p.name, date: d.toISOString(), duration, type,
                recurring: recurring === "none" ? null : recurring,
              });
              toast.success("Appointment booked");
              setOpen(false);
            }}
          >Book appointment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
