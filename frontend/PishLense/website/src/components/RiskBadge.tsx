import { type RiskLevel } from "@/types/phishing";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

const config: Record<RiskLevel, { label: string; bgClass: string; textClass: string; icon: React.ElementType }> = {
  high: {
    label: "High Risk",
    bgClass: "bg-risk-high/10",
    textClass: "text-risk-high",
    icon: ShieldAlert,
  },
  medium: {
    label: "Medium",
    bgClass: "bg-risk-medium/10",
    textClass: "text-risk-medium",
    icon: AlertTriangle,
  },
  safe: {
    label: "Safe",
    bgClass: "bg-risk-safe/10",
    textClass: "text-risk-safe",
    icon: ShieldCheck,
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function RiskBadge({ level, size = "sm", showIcon = true }: RiskBadgeProps) {
  const { label, bgClass, textClass, icon: Icon } = config[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        bgClass,
        textClass
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {label}
    </span>
  );
}
