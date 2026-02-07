import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "high" | "medium" | "safe";
  description?: string;
}

const variantStyles = {
  default: "border-border bg-card",
  high: "border-risk-high/20 bg-risk-high/5",
  medium: "border-risk-medium/20 bg-risk-medium/5",
  safe: "border-risk-safe/20 bg-risk-safe/5",
};

const iconContainerStyles = {
  default: "bg-primary/10 text-primary",
  high: "bg-risk-high/10 text-risk-high",
  medium: "bg-risk-medium/10 text-risk-medium",
  safe: "bg-risk-safe/10 text-risk-safe",
};

export function StatsCard({ title, value, icon: Icon, variant = "default", description }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-sm transition-all hover:shadow-md",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          iconContainerStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
