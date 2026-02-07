import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getScanById, initializeData } from "@/lib/dataStore";
import type { Scan } from "@/types/phishing";
import { RiskBadge } from "@/components/RiskBadge";
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Brain,
  Link2,
  Info,
  FileText,
  Shield,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function HighlightedBody({ body, phrases }: { body: string; phrases: Scan["dangerousPhrases"] }) {
  if (!phrases.length) return <p className="whitespace-pre-wrap text-sm text-card-foreground">{body}</p>;

  let result = body;
  const parts: { text: string; isHighlighted: boolean; reason?: string }[] = [];

  // Simple approach: find and mark each phrase
  let remaining = body;
  const sortedPhrases = [...phrases].sort(
    (a, b) => remaining.toLowerCase().indexOf(a.text.toLowerCase()) - remaining.toLowerCase().indexOf(b.text.toLowerCase())
  );

  let lastIndex = 0;
  const lowerBody = body.toLowerCase();

  for (const phrase of sortedPhrases) {
    const idx = lowerBody.indexOf(phrase.text.toLowerCase(), lastIndex);
    if (idx === -1) continue;

    if (idx > lastIndex) {
      parts.push({ text: body.slice(lastIndex, idx), isHighlighted: false });
    }
    parts.push({
      text: body.slice(idx, idx + phrase.text.length),
      isHighlighted: true,
      reason: phrase.reason,
    });
    lastIndex = idx + phrase.text.length;
  }

  if (lastIndex < body.length) {
    parts.push({ text: body.slice(lastIndex), isHighlighted: false });
  }

  return (
    <p className="whitespace-pre-wrap text-sm text-card-foreground leading-relaxed">
      {parts.map((part, i) =>
        part.isHighlighted ? (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className="cursor-help rounded-sm bg-risk-high/20 px-1 py-0.5 text-risk-high font-medium">
                {part.text}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{part.reason}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  );
}

const techniqueLabels: Record<string, { label: string; emoji: string }> = {
  urgency: { label: "Urgency", emoji: "⏰" },
  fear: { label: "Fear", emoji: "😨" },
  impersonation: { label: "Impersonation", emoji: "🎭" },
  greed: { label: "Greed", emoji: "💰" },
};

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData().then(() => {
      if (id) setScan(getScanById(id) ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Loading scan details...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">Scan not found</p>
        <p className="text-muted-foreground mb-4">This scan may have been deleted or doesn't exist.</p>
        <Link to="/scans" className="text-sm text-primary hover:underline">
          ← Back to scans
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back */}
      <Link
        to="/scans"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Scan History
      </Link>

      {/* Email Overview Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className={`px-6 py-4 ${
          scan.riskLevel === 'high'
            ? 'bg-risk-high/10 border-b border-risk-high/20'
            : scan.riskLevel === 'medium'
            ? 'bg-risk-medium/10 border-b border-risk-medium/20'
            : 'bg-risk-safe/10 border-b border-risk-safe/20'
        }`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <RiskBadge level={scan.riskLevel} size="md" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {new Date(scan.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-card-foreground mb-3">{scan.subject}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium text-card-foreground">{scan.senderName}</span>
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {scan.sender}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Analysis Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <AlertTriangle className="h-5 w-5 text-primary" /> Risk Analysis
        </h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Confidence Score */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Confidence Score</span>
              <span className="font-bold text-card-foreground">{scan.confidence}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-500 ${
                  scan.riskLevel === "high"
                    ? "bg-risk-high"
                    : scan.riskLevel === "medium"
                    ? "bg-risk-medium"
                    : "bg-risk-safe"
                }`}
                style={{ width: `${scan.confidence}%` }}
              />
            </div>
          </div>
          
          {/* Techniques Detected */}
          {scan.techniques.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Techniques Detected</p>
              <div className="flex flex-wrap gap-2">
                {scan.techniques.map((t) => {
                  const tech = techniqueLabels[t] ?? { label: t, emoji: "⚠️" };
                  return (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tech.emoji} {tech.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Body Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <FileText className="h-5 w-5 text-primary" /> Email Content
          {scan.dangerousPhrases.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              — hover highlighted text for details
            </span>
          )}
        </h3>
        <div className="rounded-lg border border-border bg-muted/30 p-5 font-mono text-sm">
          <HighlightedBody body={scan.body} phrases={scan.dangerousPhrases} />
        </div>
      </div>

      {/* Why This Is Dangerous */}
      {scan.reasons.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Brain className="h-5 w-5 text-primary" /> Analysis Findings
          </h3>
          <ul className="space-y-3">
            {scan.reasons.map((reason, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  scan.riskLevel === 'high' 
                    ? 'bg-risk-high/10 text-risk-high' 
                    : scan.riskLevel === 'medium'
                    ? 'bg-risk-medium/10 text-risk-medium'
                    : 'bg-risk-safe/10 text-risk-safe'
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <span className="text-card-foreground pt-0.5">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Link Analysis */}
      {scan.links.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Link2 className="h-5 w-5 text-primary" /> Link Analysis
          </h3>
          <div className="space-y-3">
            {scan.links.map((link, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/30 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-card-foreground">
                    {link.displayText}
                  </span>
                  <RiskBadge level={link.riskLevel} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono break-all">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {link.actualUrl}
                </div>
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {link.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className={`rounded-xl border p-6 shadow-sm ${
        scan.riskLevel === "high"
          ? "border-risk-high/30 bg-risk-high/5"
          : scan.riskLevel === "medium"
          ? "border-risk-medium/30 bg-risk-medium/5"
          : "border-risk-safe/30 bg-risk-safe/5"
      }`}>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <ShieldCheck className={`h-5 w-5 ${
            scan.riskLevel === 'high' 
              ? 'text-risk-high' 
              : scan.riskLevel === 'medium'
              ? 'text-risk-medium'
              : 'text-risk-safe'
          }`} /> Recommended Action
        </h3>
        <p className="text-sm text-card-foreground">{scan.recommendation}</p>
      </div>
    </div>
  );
}
