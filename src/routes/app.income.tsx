import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { format, subMonths, isSameMonth } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/income")({ component: Income });

function Income() {
  const { transactions, addTransaction } = useStore();

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
  const byMonth = months.map((m) => ({
    label: format(m, "MMM"),
    income: transactions.filter((t) => t.type === "income" && isSameMonth(new Date(t.date), m)).reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter((t) => t.type === "expense" && isSameMonth(new Date(t.date), m)).reduce((s, t) => s + t.amount, 0),
  }));
  const max = Math.max(1, ...byMonth.map((m) => m.income));
  const thisMonth = byMonth[byMonth.length - 1];
  const net = thisMonth.income - thisMonth.expense;

  const visits = useMemo(() => transactions.filter((t) => t.type === "income" && t.category === "Visit").length, [transactions]);

  return (
    <AppShell title="Income" right={<NewTxDialog onCreate={addTransaction} />}>
      <div className="gradient-hero mx-5 mt-4 rounded-3xl px-5 py-5 text-primary-foreground shadow-card">
        <div className="text-xs uppercase tracking-widest opacity-80">This month · {format(now, "MMMM")}</div>
        <div className="mt-1 flex items-end gap-2">
          <div className="text-4xl font-bold">${thisMonth.income.toLocaleString()}</div>
          <div className={`mb-1 text-xs font-semibold ${net >= 0 ? "text-white/90" : "text-red-100"}`}>
            {net >= 0 ? "+" : ""}${net} net
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <MiniStat label="Visits" value={visits} />
          <MiniStat label="Expenses" value={`$${thisMonth.expense}`} />
          <MiniStat label="Avg / visit" value={`$${visits ? Math.round(thisMonth.income / Math.max(1, visits)) : 0}`} />
        </div>
      </div>

      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">6-month revenue</h2>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-end gap-2 rounded-2xl border bg-surface p-4 shadow-soft">
          {byMonth.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end">
                <div className="w-full rounded-t-md gradient-primary" style={{ height: `${(m.income / max) * 100}%` }} />
              </div>
              <div className="text-[11px] font-medium">{m.label}</div>
              <div className="text-[10px] text-muted-foreground">${m.income}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent transactions</h2>
        <ul className="space-y-2">
          {transactions.slice(0, 20).map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft">
              <div className={`grid h-10 w-10 place-items-center rounded-full ${t.type === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.category}{t.note ? ` — ${t.note}` : ""}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</div>
              </div>
              <div className={`text-sm font-bold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                {t.type === "income" ? "+" : "−"}${t.amount}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-widest opacity-75">{label}</div>
      <div className="mt-0.5 text-base font-bold">{value}</div>
    </div>
  );
}

function NewTxDialog({ onCreate }: any) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Visit");
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" />Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Amount ($)</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <Button
            className="w-full gradient-primary text-primary-foreground"
            onClick={() => {
              onCreate({ type, amount, category, note, date: new Date().toISOString() });
              toast.success("Transaction added");
              setOpen(false); setAmount(0); setNote("");
            }}
          >Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
