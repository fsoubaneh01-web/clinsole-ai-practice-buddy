import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateAssistantContent, type AssistantKind } from "@/lib/assistant.functions";
import { useStore, PLAN_LIMITS } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { Copy, GraduationCap, Loader2, Megaphone, MessageCircle, Sparkles, TrendingUp, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/assistant")({ component: Assistant });

const kinds: { id: AssistantKind; label: string; icon: any; hint: string; desc: string }[] = [
  { id: "followup", label: "Follow-up message", icon: MessageCircle, hint: "Patient first name or context", desc: "Warm, professional check-ins" },
  { id: "education", label: "Patient education", icon: GraduationCap, hint: "Topic (e.g. diabetic foot care)", desc: "Handouts and instructions" },
  { id: "marketing", label: "Marketing content", icon: Megaphone, hint: "Audience or neighbourhood", desc: "Posts and ad copy" },
  { id: "business", label: "Business suggestions", icon: TrendingUp, hint: "What are you trying to grow?", desc: "Ideas to grow your practice" },
];

function Assistant() {
  const { nurse, useAiCredit } = useStore();
  const [kind, setKind] = useState<AssistantKind>("followup");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = useServerFn(generateAssistantContent);

  const limit = PLAN_LIMITS[nurse?.plan || "free"].aiPerMonth;
  const used = nurse?.aiUsedThisMonth || 0;
  const outOfCredit = used >= limit;

  const run = async () => {
    if (!prompt.trim()) {
      toast.error("Add a little context to generate from.");
      return;
    }
    if (!(await useAiCredit("assistant"))) {
      toast.error("You've used all AI credits on the Free plan this month.");
      return;
    }
    setLoading(true);
    try {
      const res = await generate({
        data: {
          kind,
          prompt: prompt.trim(),
          nurseName: nurse?.name || "",
          credentials: nurse?.credentials || "",
          serviceArea: nurse?.serviceArea || "",
          yearsExperience: nurse?.yearsExperience || null,
        },
      });
      setOut(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate content");
    } finally { setLoading(false); }
  };

  const current = kinds.find((k) => k.id === kind)!;

  return (
    <AppShell title="AI Business Assistant">
      <Container className="max-w-5xl py-6">
        {nurse?.plan === "free" && (
          <Link to="/app/subscription" className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/30 bg-accent/60 p-4">
            <Crown className="h-5 w-5 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">Free plan · {used}/{limit} AI credits used this month</div>
              <div className="text-xs text-muted-foreground">Upgrade to Premium ($29/mo) for unlimited generations.</div>
            </div>
          </Link>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kinds.map((k) => {
            const active = kind === k.id;
            const Icon = k.icon;
            return (
              <button
                key={k.id}
                onClick={() => { setKind(k.id); setOut(""); }}
                className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left shadow-soft transition ${
                  active ? "border-primary bg-accent" : "bg-surface hover:border-primary/50"
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "gradient-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">{k.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{k.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-surface p-5 shadow-soft">
            <div className="mb-2 text-xs font-medium text-muted-foreground">{current.hint}</div>
            <Textarea rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={current.hint} />
            <Button onClick={run} disabled={loading || outOfCredit} className="mt-3 w-full gradient-primary text-primary-foreground">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Thinking…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate</>}
            </Button>
            {outOfCredit && <p className="mt-2 text-center text-xs text-muted-foreground">Upgrade to Premium for unlimited generations.</p>}
          </div>

          <div className="rounded-2xl border bg-surface p-5 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</div>
              {out && (
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(out); toast.success("Copied"); }}>
                  <Copy className="mr-1 h-3.5 w-3.5" />Copy
                </Button>
              )}
            </div>
            {out ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{out}</div>
            ) : (
              <div className="grid h-56 place-items-center rounded-xl border border-dashed bg-surface-muted text-center text-sm text-muted-foreground">
                Generated content will appear here.
              </div>
            )}
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
