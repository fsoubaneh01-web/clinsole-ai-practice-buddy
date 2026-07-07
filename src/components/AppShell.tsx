import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Users, FileText, Calendar, Wallet, Sparkles, Settings, LogOut, Crown } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/Brand";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: Home },
  { to: "/app/patients", label: "Patients", icon: Users },
  { to: "/app/soap", label: "AI SOAP", icon: FileText },
  { to: "/app/calendar", label: "Schedule", icon: Calendar },
  { to: "/app/income", label: "Business", icon: Wallet },
  { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
] as const;

const mobileTabs = nav.slice(0, 5);

export function AppShell({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const { pathname } = useLocation();
  const { nurse, signOut } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-surface lg:flex">
        <div className="px-6 py-5"><Brand size="sm" /></div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((t) => {
            const active = pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          {nurse?.plan === "free" && (
            <Link
              to="/app/subscription"
              className="mb-3 flex items-center gap-3 rounded-xl gradient-primary p-3 text-primary-foreground shadow-soft"
            >
              <Crown className="h-5 w-5" />
              <div className="text-xs leading-tight">
                <div className="font-semibold">Upgrade to Premium</div>
                <div className="opacity-90">$29/mo · Unlimited</div>
              </div>
            </Link>
          )}
          <Link
            to="/app/subscription"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> Account & plan
          </Link>
          <button
            onClick={() => { signOut(); navigate({ to: "/" }); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          {nurse && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(nurse.name || nurse.email).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 text-xs">
                <div className="truncate font-semibold">{nurse.name || "Nurse"}</div>
                <div className="truncate text-muted-foreground">{nurse.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        {(title || actions) && (
          <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-surface/95 px-5 py-3 backdrop-blur lg:px-8 lg:py-4">
            <div className="flex items-center gap-3">
              <div className="lg:hidden"><Brand size="sm" /></div>
              {title && <h1 className="hidden text-xl font-semibold tracking-tight lg:block">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              {nurse?.plan === "free" && (
                <Button asChild size="sm" className="hidden gradient-primary text-primary-foreground lg:inline-flex">
                  <Link to="/app/subscription"><Crown className="mr-1 h-4 w-4" />Upgrade</Link>
                </Button>
              )}
            </div>
          </header>
        )}
        {title && <div className="border-b bg-surface/60 px-5 py-3 lg:hidden"><h1 className="text-lg font-semibold">{title}</h1></div>}

        <main className="flex-1 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface/95 backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileTabs.map((t) => {
            const active = pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 lg:px-8", className)}>{children}</div>;
}
