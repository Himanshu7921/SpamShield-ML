import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addScan, getAnalysisRules } from "@/lib/dataStore";
import type { Scan, AnalysisRule } from "@/types/phishing";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";
import { Search, Sparkles, ArrowRight, FileText, ShieldCheck, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function simulateAnalysis(text: string, rules: AnalysisRule[]): Omit<Scan, "id" | "timestamp"> {
  const lowerText = text.toLowerCase();
  const matchedRules = rules.filter((r) => lowerText.includes(r.keyword.toLowerCase()));

  let riskLevel: Scan["riskLevel"] = "safe";
  let confidence = 20;
  const techniques: string[] = [];
  const reasons: string[] = [];
  const dangerousPhrases: Scan["dangerousPhrases"] = [];

  if (matchedRules.length > 0) {
    const highRisk = matchedRules.some((r) => r.riskLevel === "high");
    const medRisk = matchedRules.some((r) => r.riskLevel === "medium");
    riskLevel = highRisk ? "high" : medRisk ? "medium" : "safe";
    confidence = Math.min(
      99,
      Math.max(...matchedRules.map((r) => r.confidence)) + matchedRules.length * 5
    );

    matchedRules.forEach((r) => {
      r.techniques.forEach((t) => {
        if (!techniques.includes(t)) techniques.push(t);
      });
      r.reasons.forEach((reason) => {
        if (!reasons.includes(reason)) reasons.push(reason);
      });
      dangerousPhrases.push({
        text: r.keyword,
        reason: r.reasons[0] || "Suspicious pattern detected",
      });
    });
  } else {
    reasons.push("No known phishing patterns detected in the content.");
    confidence = 85;
  }

  // Extract a subject from first line
  const firstLine = text.split("\n")[0]?.trim() || "Manual Analysis";
  const subject = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;

  // Try to extract sender
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const sender = emailMatch ? emailMatch[0] : "unknown@manual-entry.com";

  return {
    sender,
    senderName: "Manual Entry",
    subject,
    riskLevel,
    confidence,
    body: text,
    dangerousPhrases,
    reasons,
    techniques,
    links: [],
    recommendation:
      riskLevel === "high"
        ? "This content contains high-risk phishing patterns. Do not interact with any links or provide personal information."
        : riskLevel === "medium"
        ? "This content contains some suspicious patterns. Verify the sender before taking any action."
        : "No significant phishing indicators found. Exercise normal caution.",
  };
}

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Scan | null>(null);
  const navigate = useNavigate();
  const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:5000";

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setResult(null);

    try {
      // call backend analyze endpoint
      const resp = await fetch(`${API_BASE}/analyze_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data?.error || "Analysis failed");

      const modelPrediction = data.model_prediction;
      const analysis = data.analysis || {};

      const classification = analysis.classification || modelPrediction || "Not Spam";
      const analysis_findings = analysis.analysis_findings || "No known phishing patterns detected in the content.";
      const recommended_action = analysis.recommended_action || "No action recommended.";

      // map to Scan shape used by the dashboard
      const firstLine = text.split("\n")[0]?.trim() || "Manual Analysis";
      const subject = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
      const senderMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
      const sender = senderMatch ? senderMatch[0] : "unknown@manual-entry.com";

      const riskLevel = classification.toLowerCase().includes("spam") ? (classification.toLowerCase().includes("phish") || classification.toLowerCase().includes("spam") ? "high" : "medium") : "safe";

      const reasons = Array.isArray(analysis_findings)
        ? analysis_findings
        : (analysis_findings + "").split(/\.|\n/).map((s: string) => s.trim()).filter(Boolean);

      const scan: Scan = {
        id: `manual-${Date.now()}`,
        timestamp: new Date().toISOString(),
        sender,
        senderName: "Remote Analysis",
        subject,
        riskLevel,
        confidence: riskLevel === "high" ? 90 : (riskLevel === "medium" ? 70 : 95),
        body: text,
        dangerousPhrases: [],
        reasons,
        llmAnalysis: typeof analysis_findings === "string" ? analysis_findings : undefined,
        techniques: [],
        links: [],
        recommendation: recommended_action,
      };

      addScan(scan);
      setResult(scan);
    } catch (err) {
      console.error(err);
      // fallback to local simulation if backend fails
      const rules = await getAnalysisRules();
      const analysis = simulateAnalysis(text, rules);
      const scan: Scan = {
        id: `manual-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...analysis,
      };
      addScan(scan);
      setResult(scan);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analyze Email</h2>
        <p className="text-sm text-muted-foreground">
          Paste suspicious content to detect phishing patterns
        </p>
      </div>

      {/* Analysis Input Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span>Paste email content, headers, or suspicious links below</span>
        </div>
        
        <Textarea
          placeholder="Subject: Urgent: Your account has been compromised!&#10;&#10;Dear Customer,&#10;&#10;We have detected unusual activity on your account. Please click the link below to verify your identity immediately or your account will be suspended within 24 hours.&#10;&#10;[Paste full email content here...]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="font-mono text-sm bg-background resize-none"
        />
        
        <Button
          onClick={handleAnalyze}
          disabled={!text.trim() || analyzing}
          className="w-full gap-2 h-11"
          size="lg"
        >
          {analyzing ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" /> Analyzing content...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Analyze for Threats
            </>
          )}
        </Button>
      </div>

      {/* Result Card */}
      {result && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Result Header */}
          <div className={`px-6 py-4 ${
            result.riskLevel === 'high'
              ? 'bg-risk-high/10 border-b border-risk-high/20'
              : result.riskLevel === 'medium'
              ? 'bg-risk-medium/10 border-b border-risk-medium/20'
              : 'bg-risk-safe/10 border-b border-risk-safe/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.riskLevel === 'safe' ? (
                  <ShieldCheck className="h-5 w-5 text-risk-safe" />
                ) : (
                  <AlertCircle className={`h-5 w-5 ${
                    result.riskLevel === 'high' ? 'text-risk-high' : 'text-risk-medium'
                  }`} />
                )}
                <h3 className="text-base font-semibold text-card-foreground">
                  Analysis Complete
                </h3>
              </div>
              <RiskBadge level={result.riskLevel} size="md" />
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Confidence */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-semibold text-card-foreground">{result.confidence}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${
                    result.riskLevel === "high"
                      ? "bg-risk-high"
                      : result.riskLevel === "medium"
                      ? "bg-risk-medium"
                      : "bg-risk-safe"
                  }`}
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
            </div>

            {/* Findings (LLM markdown if available) */}
            {(result.llmAnalysis && result.llmAnalysis.length > 0) ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">Findings</p>
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.llmAnalysis}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : result.reasons.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">Findings</p>
                <ul className="space-y-1.5">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium text-card-foreground mb-1">Recommendation</p>
              <p className="text-sm text-muted-foreground">{result.recommendation}</p>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate(`/scans/${result.id}`)}
            >
              View Full Analysis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
