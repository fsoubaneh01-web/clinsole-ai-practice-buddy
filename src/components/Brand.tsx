import { Footprints } from "lucide-react";

export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-3">
      <div className={`grid ${dim} place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft`}>
        <Footprints className="h-1/2 w-1/2" />
      </div>
      <div className="leading-tight">
        <div className={`${text} font-bold tracking-tight`}>ClinSole<span className="text-primary"> AI</span></div>
        {size !== "sm" && <div className="text-xs text-muted-foreground">Foot care practice assistant</div>}
      </div>
    </div>
  );
}
