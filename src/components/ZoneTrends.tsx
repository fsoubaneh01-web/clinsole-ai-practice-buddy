import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useStore, type FootAssessment, type TrendTag } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TREND_META: Record<TrendTag, { label: string; cls: string; Icon: typeof Minus }> = {
  improving: { label: "Improving", cls: "bg-success/15 text-success", Icon: ArrowUpRight },
  worsening: { label: "Worsening", cls: "bg-destructive/15 text-destructive", Icon: ArrowDownRight },
  unchanged: { label: "Unchanged", cls: "bg-muted text-muted-foreground", Icon: Minus },
  new: { label: "New", cls: "bg-warning/20 text-warning-foreground", Icon: Sparkles },
};

function zoneKey(a: FootAssessment) {
  return `${a.side ?? "?"}::${a.region}`;
}
function zoneName(a: FootAssessment) {
  const side = a.side === "L" ? "L" : a.side === "R" ? "R" : "";
  return `${side ? side + " " : ""}${a.regionLabel || a.region}`;
}

function structuredBits(a: FootAssessment) {
  const bits: string[] = [];
  if (a.pain && a.pain !== "none") bits.push(`pain ${a.pain}`);
  if (a.callus && a.callus !== "none") bits.push(`callus ${a.callus}`);
  if (a.skin?.length) bits.push(`skin ${a.skin.join("/")}`);
  const m = a.measurements;
  if (m && (m.length || m.width || m.depth)) {
    bits.push(`wound ${[m.length, m.width, m.depth].filter(Boolean).join("×")} mm`);
  }
  return bits;
}

export function ZoneTrends({ patientId }: { patientId: string }) {
  const { footAssessments, setAssessmentTrend } = useStore();
  const [zone, setZone] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const regional = useMemo(
    () => footAssessments.filter((a) => a.patientId === patientId && a.region),
    [footAssessments, patientId]
  );

  const zoneOptions = useMemo(() => {
    const m = new Map<string, string>();
    regional.forEach((a) => m.set(zoneKey(a), zoneName(a)));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [regional]);

  const groups = useMemo(() => {
    const filtered = regional.filter((a) => {
      if (zone !== "all" && zoneKey(a) !== zone) return false;
      const t = new Date(a.date).getTime();
      if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
      if (to && t > new Date(`${to}T23:59:59`).getTime()) return false;
      return true;
    });
    const m = new Map<string, FootAssessment[]>();
    filtered.forEach((a) => {
      const k = zoneKey(a);
      m.set(k, [...(m.get(k) ?? []), a]);
    });
    return [...m.entries()]
      .map(([key, list]) => ({
        key,
        name: zoneName(list[0]),
        visits: [...list].sort((x, y) => +new Date(x.date) - +new Date(y.date)),
      }))
      .sort(
        (a, b) =>
          +new Date(b.visits[b.visits.length - 1].date) - +new Date(a.visits[a.visits.length - 1].date)
      );
  }, [regional, zone, from, to]);

  if (regional.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">
        No per-zone observations recorded yet. Trends appear once zones are flagged during assessments.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border bg-surface p-4 shadow-soft md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Zone</Label>
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All zones</SelectItem>
              {zoneOptions.map(([k, name]) => (
                <SelectItem key={k} value={k}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-surface-muted p-6 text-center text-sm text-muted-foreground">
          No observations match these filters.
        </div>
      )}

      {groups.map((g) => {
        const latest = g.visits[g.visits.length - 1];
        return (
          <div key={g.key} className="rounded-2xl border bg-surface p-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{g.name}</div>
                <div className="text-xs text-muted-foreground">
                  {g.visits.length} {g.visits.length === 1 ? "visit" : "visits"} · last{" "}
                  {format(new Date(latest.date), "MMM d, yyyy")}
                </div>
              </div>
              {latest.trend && <TrendBadge trend={latest.trend} />}
            </div>

            <ol className="mt-4 space-y-4 border-l pl-4">
              {g.visits.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-semibold">{format(new Date(a.date), "MMM d, yyyy · h:mm a")}</div>
                    <TrendPicker
                      value={a.trend}
                      onChange={async (t) => {
                        const r = await setAssessmentTrend(a.id, t);
                        if (r.error) toast.error(`Couldn't save trend: ${r.error}`);
                      }}
                    />
                  </div>
                  <p className="mt-1 text-sm">{a.notes || <span className="text-muted-foreground">No observation text.</span>}</p>
                  {structuredBits(a).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">{structuredBits(a).join(" · ")}</div>
                  )}
                </li>
              ))}
            </ol>

            <PhotoStrip visits={g.visits} />
          </div>
        );
      })}
    </div>
  );
}

function TrendBadge({ trend }: { trend: TrendTag }) {
  const { label, cls, Icon } = TREND_META[trend];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function TrendPicker({ value, onChange }: { value?: TrendTag; onChange: (t: TrendTag | null) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(Object.keys(TREND_META) as TrendTag[]).map((t) => {
        const active = value === t;
        return (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            className="h-6 rounded-full px-2 text-[10px]"
            onClick={() => onChange(active ? null : t)}
          >
            {TREND_META[t].label}
          </Button>
        );
      })}
    </div>
  );
}

function PhotoStrip({ visits }: { visits: FootAssessment[] }) {
  const { getPhotoUrl } = useStore();
  const [items, setItems] = useState<{ url: string; date: string }[]>([]);
  const withPhotos = useMemo(
    () => visits.flatMap((v) => v.photoPaths.map((p) => ({ path: p, date: v.date }))),
    [visits]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      withPhotos.map(async (x) => {
        const url = await getPhotoUrl(x.path);
        return url ? { url, date: x.date } : null;
      })
    ).then((res) => {
      if (!cancelled) setItems(res.filter((x): x is { url: string; date: string } => !!x));
    });
    return () => { cancelled = true; };
  }, [withPhotos, getPhotoUrl]);

  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Photo comparison (oldest → newest)
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((it, i) => (
          <a key={i} href={it.url} target="_blank" rel="noreferrer" className="shrink-0">
            <img src={it.url} alt={`Zone photo ${format(new Date(it.date), "MMM d, yyyy")}`} className="h-28 w-28 rounded-lg border object-cover" />
            <div className="mt-1 text-center text-[10px] text-muted-foreground">{format(new Date(it.date), "MMM d")}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
