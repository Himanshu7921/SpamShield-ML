export type RiskLevel = "high" | "medium" | "safe";

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
}

export interface AnalysisRule {
  keyword: string;
  riskLevel: RiskLevel;
  confidence: number;
  reasons: string[];
  techniques: string[];
  recommendation: string;
}
