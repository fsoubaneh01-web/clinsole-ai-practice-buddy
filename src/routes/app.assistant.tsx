import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateAssistant, type AssistantKind } from "@/lib/ai-mock";
import { useStore } from "@/lib/store";
import { Copy, GraduationCap, Loader2, Megaphone, MessageCircle, Sparkles, TrendingUp, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/assistant")({ component: Assistant });

const kinds: { id: AssistantKind; label: string; icon: any; hint: string }[] = [
  { id: "followup", label: "Follow-up message", icon: MessageCircle, hint: "Patient first name or context" },
  { id: "education", label: "Patient education", icon: GraduationCap, hint: "Topic (e.g. diabetic foot care)" },
  { id: "marketing", label: "Marketing content", icon: Megaphone, hint: "Audience or neighbourhood" },
  { id: "business", label: "Business suggestions", icon: TrendingUp, hint: "What are you trying to grow?" },
];

function Assistant() {
  const { nurse } = useStore();
  const [kind, setKind] = useState<AssistantKind>("followup");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const isPremium = nurse?.plan === "premium";

  const run = async () => {
    setLoading(true);
    try {
      setOut(await generateAssistant(kind, prompt));
    } finally {
      setLoading(false);
    }
  };

  const current = kinds.find((k) => k.id === kind)!;

  return (
    <AppShell title="AI Assistant">
      <div className="px-5 pt-4">
        {!isPremium && (
          <Link to="/app/subscription" className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/30 bg-accent/60 p-3">
            <Crown className="h-5 w-5 text-primary" />
            <div className="flex-1 text-xs">
              <div className="font-semibold">Included in your trial</div>
              <div className="text-muted-foreground">Upgrade to keep AI unlimited after trial ends.</div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-2">
          {kinds.map((k) => {
            const active = kind === k.id;
            const Icon = k.icon;
            return (
              <button
                key={k.id}
                onClick={() => { setKind(k.id); setOut(""); }}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left shadow-soft transition ${
                  active ? "border-primary bg-accent" : "bg-surface"
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "gradient-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold leading-tight">{k.label}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border bg-surface p-4 shadow-soft">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{current.hint}</div>
          <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={current.hint} />
          <Button onClick={run} disabled={loading} className="mt-3 w-full gradient-primary text-primary-foreground">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Thinking…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate</>}
          </Button>
        </div>

        {out && (
          <div className="mt-4 rounded-2xl border bg-surface p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigator.clipboard?.writeText(out); toast.success("Copied"); }}
              ><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{out}</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
