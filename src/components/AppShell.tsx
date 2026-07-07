import { Link, useLocation } from "@tanstack/react-router";
import { Home, Users, FileText, Calendar, Wallet, Sparkles } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app/dashboard", label: "Home", icon: Home },
  { to: "/app/patients", label: "Patients", icon: Users },
  { to: "/app/soap", label: "SOAP", icon: FileText },
  { to: "/app/calendar", label: "Schedule", icon: Calendar },
  { to: "/app/income", label: "Income", icon: Wallet },
] as const;

export function AppShell({ children, title, right }: { children: ReactNode; title?: string; right?: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {title && (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-surface/95 px-5 py-3 backdrop-blur">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {right}
        </header>
      )}
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-surface/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
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

export function FAB({ to, icon: Icon = Sparkles, label }: { to: string; icon?: typeof Sparkles; label?: string }) {
  return (
    <Link
      to={to}
      className="fixed bottom-24 right-1/2 z-30 flex translate-x-[calc(50%+8.5rem)] items-center gap-2 rounded-full gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card active:scale-95"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
