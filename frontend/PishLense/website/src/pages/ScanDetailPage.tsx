import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getScanById, initializeData } from "@/lib/dataStore";
import type { Scan } from "@/types/phishing";
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  ShieldCheck,
  Brain,
  Link2,
  FileText,
  Shield,
  CheckCircle2,
  Gauge,
  Lock,
  Globe,
  Lightbulb,
  TrendingUp,
  Activity,
  Sparkles,
  ExternalLink,
} from "lucide-react";

// Risk level configuration
const riskConfig = {
  high: {
    color: "text-red-500",
    bgGradient: "from-red-500/10 via-red-500/5 to-transparent",
    solidBg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "shadow-red-500/20",
    label: "High Risk",
    icon: "🚨",
  },
  medium: {
    color: "text-amber-500",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    solidBg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/20",
    label: "Medium Risk",
    icon: "⚠️",
  },
  safe: {
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    solidBg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/20",
    label: "Safe",
    icon: "✓",
  },
};

// Circular progress component
function CircularProgress({ value, size = 120, strokeWidth = 8, riskLevel }: { 
  value: number; 
  size?: number; 
  strokeWidth?: number;
  riskLevel: "high" | "medium" | "safe";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const config = riskConfig[riskLevel];
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={config.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${config.color}`}>{value}%</span>
        <span className="text-xs text-muted-foreground">confidence</span>
      </div>
    </div>
  );
}

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
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Analyzing scan data...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6">
            <Shield className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-xl font-semibold text-foreground mb-2">Scan not found</p>
          <p className="text-muted-foreground mb-6">This scan may have been deleted or doesn't exist.</p>
          <Link to="/scans" className="text-primary hover:underline font-medium">
            ← Back to scans
          </Link>
        </div>
      </div>
    );
  }

  const risk = riskConfig[scan.riskLevel] || riskConfig.safe;
  const confidenceValue = typeof scan.confidence === 'number' 
    ? (scan.confidence > 1 ? scan.confidence : Math.round(scan.confidence * 100))
    : 90;

  // Get first URL for display
  const primaryUrl = scan.detectedUrls?.[0] || scan.links?.[0];
  const urlCount = (scan.detectedUrls?.length || 0) + (scan.links?.length || 0);

  return (
    <div className="min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] flex flex-col gap-3 lg:gap-4 pb-6 lg:pb-0 lg:overflow-hidden">
      {/* Top Bar - Back button and timestamp */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <Link
          to="/scans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="hidden sm:inline">Back to History</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Clock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{new Date(scan.timestamp).toLocaleString()}</span>
          <span className="sm:hidden">{new Date(scan.timestamp).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Dashboard Grid - Responsive */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 auto-rows-auto lg:grid-rows-6 gap-3 min-h-0">
        
        {/* Status Card - Large left panel */}
        <div className={`sm:col-span-1 lg:col-span-4 lg:row-span-3 rounded-2xl border ${risk.border} bg-gradient-to-br ${risk.bgGradient} p-4 lg:p-5 flex flex-col min-h-[200px] lg:min-h-0`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Status</p>
              <h2 className={`text-xl lg:text-2xl font-bold ${risk.color} truncate`}>{risk.label}</h2>
            </div>
            <div className={`text-2xl lg:text-4xl ${risk.solidBg} p-2 lg:p-3 rounded-xl shrink-0`}>
              {risk.icon}
            </div>
          </div>
          <div className="flex justify-evenly items-center">
            <div className=" flex items-center justify-center py-2">
              <CircularProgress value={confidenceValue} size={130} riskLevel={scan.riskLevel} />
            </div>
            
            {scan.modelPrediction && (
              <div className=" pt-3 border-t border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">ML Prediction</span>
                  </div>
                  <span className={`inline-block text-xs lg:text-sm font-semibold px-3 py-1.5 rounded-lg w-full text-center ${
                    scan.modelPrediction.toLowerCase().includes('spam') && !scan.modelPrediction.toLowerCase().includes('not')
                      ? 'text-red-600 bg-red-500/10 border border-red-500/20' : 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {scan.modelPrediction}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject & Sender - Top wide card */}
        <div className="sm:col-span-1 lg:col-span-5 lg:row-span-2 rounded-2xl border border-border bg-card p-4 lg:p-5 flex flex-col min-h-[140px] lg:min-h-0">
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email Details</span>
          </div>
          <h1 className="text-base lg:text-lg font-bold text-card-foreground line-clamp-2 mb-2 lg:mb-3 leading-tight">{scan.subject}</h1>
          <div className="mt-auto flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-card-foreground truncate">{scan.senderName}</p>
              <p className="text-xs text-muted-foreground truncate">{scan.sender}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats - Stacked cards on right */}
        <div className="sm:col-span-1 lg:col-span-3 lg:row-span-1 rounded-2xl border border-border bg-gradient-to-r from-cyan-500/5 to-cyan-500/10 p-3 lg:p-4 flex items-center gap-3 lg:gap-4">
          <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
            <Link2 className="h-4 w-4 lg:h-5 lg:w-5 text-cyan-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl lg:text-2xl font-bold text-card-foreground">{urlCount}</p>
            <p className="text-xs text-muted-foreground truncate">URLs Detected</p>
          </div>
        </div>

        <div className="sm:col-span-1 lg:col-span-3 lg:row-span-1 rounded-2xl border border-border bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 p-3 lg:p-4 flex items-center gap-3 lg:gap-4">
          <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl lg:text-2xl font-bold text-card-foreground">{scan.indicators?.length || 0}</p>
            <p className="text-xs text-muted-foreground truncate">Indicators</p>
          </div>
        </div>

        {/* AI Summary Card - Medium width */}
        <div className="sm:col-span-2 lg:col-span-5 lg:row-span-2 rounded-2xl border border-border bg-card p-4 lg:p-5 flex flex-col min-h-[140px] lg:min-h-0">
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <Brain className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">AI Analysis</span>
          </div>
          <div className="flex-1 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-3 lg:p-4 border border-primary/10">
            <p className="text-sm text-card-foreground leading-relaxed line-clamp-4">
              {scan.analysisSummary || scan.llmAnalysis || "No AI analysis available for this scan."}
            </p>
          </div>
        </div>

        {/* URL Card - Compact */}
        <div className="sm:col-span-1 lg:col-span-3 lg:row-span-2 rounded-2xl border border-border bg-card p-3 lg:p-4 flex flex-col min-h-[120px] lg:min-h-0">
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <Globe className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Primary URL</span>
          </div>
          {primaryUrl ? (
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-xs font-mono text-card-foreground break-all line-clamp-2 mb-2 lg:mb-3">
                {('url' in primaryUrl ? primaryUrl.url : primaryUrl.actualUrl)}
              </p>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {'is_https' in primaryUrl && primaryUrl.is_https !== undefined && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 lg:py-1 rounded-lg text-xs font-medium ${
                    primaryUrl.is_https ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                  }`}>
                    <Lock className="h-3 w-3" />
                    {primaryUrl.is_https ? 'Secure' : 'Insecure'}
                  </span>
                )}
                {'domain_reputation' in primaryUrl && (
                  <span className={`px-2 py-0.5 lg:py-1 rounded-lg text-xs font-medium capitalize ${
                    primaryUrl.domain_reputation === 'trusted' ? 'bg-emerald-500/10 text-emerald-600' :
                    primaryUrl.domain_reputation === 'malicious' ? 'bg-red-500/10 text-red-600' :
                    primaryUrl.domain_reputation === 'suspicious' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {primaryUrl.domain_reputation}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No URLs detected
            </div>
          )}
        </div>

        {/* Email Preview - Larger card bottom left */}
        <div className="sm:col-span-1 lg:col-span-4 lg:row-span-3 rounded-2xl border border-border bg-card p-4 lg:p-5 flex flex-col min-h-[180px] lg:min-h-0 order-last sm:order-none">
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email Content</span>
          </div>
          <div className="flex-1 rounded-xl bg-muted/30 p-2 lg:p-4 overflow-y-scroll">
            <p className="text-xs lg:text-sm text-card-foreground whitespace-pre-wrap line-clamp-[8] lg:line-clamp-[10] leading-relaxed font-mono ">
              {scan.body}
            </p>
          </div>
        </div>

        {/* Recommendation Card - Wide bottom */}
        <div className={`sm:col-span-2 lg:col-span-5 lg:row-span-2 rounded-2xl border ${risk.border} ${risk.solidBg} p-4 lg:p-5 flex flex-col min-h-[100px] lg:min-h-0`}>
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <ShieldCheck className={`h-4 w-4 ${risk.color} shrink-0`} />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Recommendation</span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="flex items-start gap-3">
              <div className={`h-7 w-7 lg:h-8 lg:w-8 rounded-lg ${risk.solidBg} flex items-center justify-center shrink-0`}>
                <CheckCircle2 className={`h-4 w-4 lg:h-5 lg:w-5 ${risk.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-card-foreground mb-1 line-clamp-2">
                  {scan.recommendedActions?.primary || scan.recommendation}
                </p>
                {scan.recommendedActions?.secondary?.[0] && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {scan.recommendedActions.secondary[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Tip - Small card bottom right */}
        <div className="sm:col-span-1 lg:col-span-3 lg:row-span-2 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-3 lg:p-4 flex flex-col min-h-[100px] lg:min-h-0">
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <Lightbulb className="h-4 w-4 text-cyan-500 shrink-0" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Safety Tip</span>
          </div>
          <div className="flex-1 flex items-center">
            <p className="text-xs lg:text-sm text-card-foreground leading-relaxed line-clamp-3">
              {scan.userGuidance?.safety_tip || "Always verify sender identity before clicking links or downloading attachments."}
            </p>
          </div>
        </div>

        {/* Analysis ID - Small footer card */}
        <div className="sm:col-span-1 lg:col-span-4 lg:row-span-1 rounded-2xl border border-border bg-muted/30 px-4 lg:px-5 py-2.5 lg:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Analysis ID</span>
          </div>
          <code className="text-[10px] lg:text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-[120px] lg:max-w-none">
            {scan.analysisId || scan.id}
          </code>
        </div>

        {/* Techniques Found - Bottom right */}
        <div className="sm:col-span-1 lg:col-span-3 lg:row-span-1 rounded-2xl border border-border bg-card px-3 lg:px-4 py-2.5 lg:py-3 flex items-center gap-2 lg:gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Techniques</span>
          </div>
          <div className="flex gap-1 flex-wrap flex-1 justify-end">
            {scan.techniques && scan.techniques.length > 0 ? (
              scan.techniques.slice(0, 2).map((t, i) => (
                <span key={i} className="text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[60px] lg:max-w-none">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-500 font-medium">None</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
