export type RiskLevel = "high" | "medium" | "safe";
export type DomainReputation = "trusted" | "suspicious" | "malicious" | "unknown";
export type IndicatorSeverity = "low" | "medium" | "high" | "critical";
export type IndicatorType = "urgency" | "impersonation" | "suspicious_url" | "insecure_link" | "fear" | "greed";

export interface DangerousPhrase {
  text: string;
  reason: string;
}

export interface LinkAnalysis {
  displayText: string;
  actualUrl: string;
  riskLevel: RiskLevel;
  reason: string;
}

// New URL structure from LLM response
export interface DetectedUrl {
  url: string;
  is_https: boolean;
  domain_reputation: DomainReputation;
}

// New indicator structure from LLM response
export interface Indicator {
  type: IndicatorType | string;
  severity: IndicatorSeverity;
  description: string;
}

// User guidance from LLM response
export interface UserGuidance {
  intent: string;
  impact: string;
  safety_tip: string;
}

// Recommended actions from LLM response
export interface RecommendedActions {
  primary: string;
  secondary: string[];
}

// Full LLM analysis response structure
export interface LLMAnalysisResponse {
  analysis_id?: string;
  created_at?: string;
  message?: {
    urls: DetectedUrl[];
  };
  classification?: {
    label: string;
    confidence_score: number;
    risk_level: "Low" | "Medium" | "High";
  };
  analysis?: {
    summary: string;
    indicators: Indicator[];
  };
  recommended_actions?: RecommendedActions;
  user_guidance?: UserGuidance;
  // Legacy fields
  analysis_findings?: string;
  recommended_action?: string;
}

export interface Scan {
  id: string;
  sender: string;
  senderName: string;
  subject: string;
  riskLevel: RiskLevel;
  confidence: number;
  timestamp: string;
  body: string;
  dangerousPhrases: DangerousPhrase[];
  reasons: string[];
  techniques: string[];
  links: LinkAnalysis[];
  recommendation: string;
  llmAnalysis?: string;
  // New fields from updated backend
  analysisId?: string;
  detectedUrls?: DetectedUrl[];
  indicators?: Indicator[];
  userGuidance?: UserGuidance;
  recommendedActions?: RecommendedActions;
  analysisSummary?: string;
  modelPrediction?: string;
  llmRaw?: LLMAnalysisResponse;
}

export interface AnalysisRule {
  keyword: string;
  riskLevel: RiskLevel;
  confidence: number;
  reasons: string[];
  techniques: string[];
  recommendation: string;
}
