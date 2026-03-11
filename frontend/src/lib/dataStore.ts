import type { Scan, AnalysisRule, Indicator, DetectedUrl, UserGuidance, RecommendedActions } from "@/types/phishing";

const STORAGE_KEY = "phishlens_scans";
const INITIALIZED_KEY = "phishlens_initialized";

export async function initializeData(): Promise<void> {
  // Check if we already have scans in localStorage (from extension or previous sessions)
  const existingScans = localStorage.getItem(STORAGE_KEY);
  
  if (existingScans) {
    // Already have data, don't overwrite with dummy data
    localStorage.setItem(INITIALIZED_KEY, "true");
    return;
  }

  // Only initialize with empty array if no data exists
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(INITIALIZED_KEY, "true");
  
  // Note: We no longer load dummy data from /data/scans.json
  // All data comes from the extension or manual /analyze page
}

export function getScans(): Scan[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Scan[];
  } catch {
    return [];
  }
}

export function getScanById(id: string): Scan | undefined {
  return getScans().find((s) => s.id === id);
}

export function addScan(scan: Scan): void {
  const scans = getScans();
  scans.unshift(scan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INITIALIZED_KEY);
}

// Seed dummy data for testing - generates realistic scans over 5 days
export function seedDummyData(): number {
  const dummyScans: Scan[] = generateDummyScans();
  const existingScans = getScans();
  const allScans = [...dummyScans, ...existingScans];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allScans));
  return dummyScans.length;
}

function generateDummyScans(): Scan[] {
  const scans: Scan[] = [];
  const now = new Date();
  
  // Template data for generating varied scans
  const spamTemplates = [
    {
      sender: "security@paypa1-support.com",
      senderName: "PayPal Security Team",
      subject: "Urgent: Your account has been compromised - Verify Now",
      body: "Dear Customer,\n\nWe have detected suspicious activity on your PayPal account. Your account has been temporarily limited. You must verify your identity within 24 hours or your account will be permanently suspended.\n\nClick the link below to verify your account immediately:\nhttps://paypa1-verify.suspicious-domain.com/login\n\nFailure to act will result in permanent account closure.\n\nPayPal Security Team",
      modelPrediction: "Spam",
      riskLevel: "high" as const,
      indicators: [
        { type: "urgency", severity: "high" as const, description: "Creates artificial urgency with 24-hour deadline to force immediate action" },
        { type: "impersonation", severity: "critical" as const, description: "Impersonates PayPal using lookalike domain 'paypa1' with number '1'" },
        { type: "suspicious_url", severity: "high" as const, description: "Contains suspicious URL that doesn't match official PayPal domain" }
      ],
      detectedUrls: [
        { url: "https://paypa1-verify.suspicious-domain.com/login", is_https: true, domain_reputation: "malicious" as const }
      ],
      userGuidance: {
        intent: "Steal PayPal login credentials and financial information",
        impact: "Account takeover, financial theft, identity fraud",
        safety_tip: "Never click links in emails claiming account issues. Log in directly through the official website."
      },
      recommendedActions: {
        primary: "Delete this email immediately and do NOT click any links",
        secondary: ["Report to PayPal's official phishing email", "Check your account directly at paypal.com"]
      }
    },
    {
      sender: "admin@micros0ft-security.com",
      senderName: "Microsoft Account Team",
      subject: "⚠️ Unusual sign-in activity on your Microsoft account",
      body: "Microsoft account\nUnusual sign-in activity\n\nWe detected something unusual about a recent sign-in to your Microsoft account.\n\nSign-in details:\nCountry/region: Russia\nIP address: 185.220.101.45\nDate: Today\nPlatform: Linux\nBrowser: Firefox\n\nIf this wasn't you, please secure your account immediately:\nhttps://micros0ft-security.com/account/verify",
      modelPrediction: "Spam",
      riskLevel: "high" as const,
      indicators: [
        { type: "fear", severity: "high" as const, description: "Creates fear about unauthorized access from foreign country" },
        { type: "impersonation", severity: "critical" as const, description: "Fake Microsoft domain using '0' instead of 'o'" },
        { type: "suspicious_url", severity: "high" as const, description: "Malicious verification link to credential harvesting site" }
      ],
      detectedUrls: [
        { url: "https://micros0ft-security.com/account/verify", is_https: true, domain_reputation: "malicious" as const }
      ],
      userGuidance: {
        intent: "Harvest Microsoft credentials for account takeover",
        impact: "Access to emails, OneDrive files, and linked services",
        safety_tip: "Microsoft will never ask you to verify through third-party links."
      },
      recommendedActions: {
        primary: "Do not click any links - this is a phishing attempt",
        secondary: ["Go directly to account.microsoft.com to check activity", "Enable two-factor authentication"]
      }
    },
    {
      sender: "prize@lottery-winner-uk.com",
      senderName: "UK National Lottery",
      subject: "🎉 CONGRATULATIONS! You've Won £1,500,000!",
      body: "CONGRATULATIONS!!!\n\nYour email was randomly selected in our online draw. You have won £1,500,000 (One Million Five Hundred Thousand British Pounds)!\n\nTo claim your prize, reply with:\n- Full Name\n- Address\n- Phone Number\n- Bank Details for transfer\n\nThis offer expires in 48 hours!\n\nRegards,\nDr. James Wilson\nUK National Lottery Claims Dept.",
      modelPrediction: "Spam",
      riskLevel: "high" as const,
      indicators: [
        { type: "greed", severity: "high" as const, description: "Promises unrealistic lottery winnings to lure victims" },
        { type: "urgency", severity: "medium" as const, description: "48-hour deadline creates pressure to respond quickly" },
        { type: "impersonation", severity: "high" as const, description: "Falsely claims to be UK National Lottery" }
      ],
      detectedUrls: [],
      userGuidance: {
        intent: "Collect personal and banking information for identity theft and financial fraud",
        impact: "Financial loss, identity theft, bank account compromise",
        safety_tip: "You cannot win a lottery you never entered. Legitimate lotteries never ask for fees or personal info via email."
      },
      recommendedActions: {
        primary: "Delete immediately - this is a classic advance fee fraud scam",
        secondary: ["Never share banking details via email", "Report to Action Fraud UK"]
      }
    },
    {
      sender: "delivery@fedx-tracking.net",
      senderName: "FedEx Delivery Notice",
      subject: "Your package could not be delivered - Action Required",
      body: "FedEx Delivery Notification\n\nDear Customer,\n\nWe attempted to deliver your package today but no one was available to sign.\n\nTracking Number: 7892-4521-3847-2918\n\nTo reschedule delivery, please confirm your address and pay the $2.99 redelivery fee:\nhttp://fedx-tracking.net/redelivery/pay\n\nIf not claimed within 5 days, your package will be returned to sender.\n\nFedEx Customer Service",
      modelPrediction: "Spam",
      riskLevel: "high" as const,
      indicators: [
        { type: "impersonation", severity: "high" as const, description: "Typo-squatting domain 'fedx' impersonating FedEx" },
        { type: "insecure_link", severity: "critical" as const, description: "HTTP link (not HTTPS) to payment page - highly suspicious" },
        { type: "urgency", severity: "medium" as const, description: "5-day deadline creates artificial pressure" }
      ],
      detectedUrls: [
        { url: "http://fedx-tracking.net/redelivery/pay", is_https: false, domain_reputation: "malicious" as const }
      ],
      userGuidance: {
        intent: "Steal credit card information through fake payment page",
        impact: "Credit card fraud, financial theft",
        safety_tip: "FedEx never asks for payment via unsolicited emails. Track packages only on fedex.com"
      },
      recommendedActions: {
        primary: "Do not click - this is a payment card phishing scam",
        secondary: ["Check fedex.com directly if expecting a package", "Report phishing to FedEx"]
      }
    },
    {
      sender: "ceo@company-internal.org",
      senderName: "John Smith (CEO)",
      subject: "Urgent wire transfer needed TODAY",
      body: "Hi,\n\nI need you to process an urgent wire transfer for a confidential acquisition we're finalizing today.\n\nAmount: $45,000\nBank: First National Bank\nAccount: 8847291036\nRouting: 021000021\n\nThis is time-sensitive - please complete within the hour. I'm in meetings all day so just email me confirmation once done.\n\nThanks,\nJohn\n\nSent from my iPhone",
      modelPrediction: "Spam",
      riskLevel: "high" as const,
      indicators: [
        { type: "impersonation", severity: "critical" as const, description: "Business Email Compromise (BEC) impersonating CEO" },
        { type: "urgency", severity: "critical" as const, description: "Extreme urgency demanding immediate wire transfer" },
        { type: "suspicious_url", severity: "low" as const, description: "No links but requests financial action" }
      ],
      detectedUrls: [],
      userGuidance: {
        intent: "Trick employees into sending money to attacker's account",
        impact: "Direct financial loss of $45,000, potentially more in future attacks",
        safety_tip: "Always verify wire transfer requests through a separate channel (phone call to known number)."
      },
      recommendedActions: {
        primary: "STOP - Verify this request by calling the CEO directly on a known number",
        secondary: ["Report to IT security immediately", "Do not reply to this email"]
      }
    }
  ];
  
  const safeTemplates = [
    {
      sender: "newsletter@techcrunch.com",
      senderName: "TechCrunch Daily",
      subject: "Today's Top Tech Stories - Daily Digest",
      body: "Good morning!\n\nHere are today's top tech stories:\n\n1. AI Breakthrough: New model achieves human-level reasoning\n2. Apple announces new product event for March\n3. Startup raises $50M for cybersecurity platform\n\nRead more at techcrunch.com\n\nUnsubscribe from this newsletter",
      modelPrediction: "Not Spam",
      riskLevel: "safe" as const,
      indicators: [],
      detectedUrls: [
        { url: "https://techcrunch.com/daily", is_https: true, domain_reputation: "trusted" as const }
      ],
      userGuidance: {
        intent: "none",
        impact: "none",
        safety_tip: "This appears to be a legitimate newsletter from a trusted source."
      },
      recommendedActions: {
        primary: "Safe to read - this is a legitimate newsletter",
        secondary: ["You can unsubscribe if you no longer want these emails"]
      }
    },
    {
      sender: "noreply@github.com",
      senderName: "GitHub",
      subject: "[GitHub] A new sign-in to your account",
      body: "Hey there!\n\nA new sign-in was detected on your GitHub account.\n\nBrowser: Chrome on Windows\nLocation: Your City, Country\nTime: Just now\n\nIf this was you, you can ignore this email.\nIf this wasn't you, please review your account security settings.\n\nThanks,\nThe GitHub Team",
      modelPrediction: "Not Spam",
      riskLevel: "safe" as const,
      indicators: [],
      detectedUrls: [
        { url: "https://github.com/settings/security", is_https: true, domain_reputation: "trusted" as const }
      ],
      userGuidance: {
        intent: "none",
        impact: "none",
        safety_tip: "Legitimate security notification from GitHub."
      },
      recommendedActions: {
        primary: "Safe - this is a standard GitHub security notification",
        secondary: ["Review if you don't recognize the sign-in"]
      }
    },
    {
      sender: "receipts@uber.com",
      senderName: "Uber Receipts",
      subject: "Your Tuesday evening trip with Uber",
      body: "Thanks for riding with Uber!\n\nTrip details:\nPickup: 123 Main Street\nDropoff: 456 Oak Avenue\nDistance: 5.2 miles\nTime: 18 minutes\n\nTotal: $14.52\n\nRate your driver and view full receipt at uber.com/trips",
      modelPrediction: "Not Spam",
      riskLevel: "safe" as const,
      indicators: [],
      detectedUrls: [
        { url: "https://uber.com/trips", is_https: true, domain_reputation: "trusted" as const }
      ],
      userGuidance: {
        intent: "none",
        impact: "none",
        safety_tip: "Standard ride receipt from Uber."
      },
      recommendedActions: {
        primary: "Safe - legitimate Uber receipt",
        secondary: []
      }
    },
    {
      sender: "team@slack.com",
      senderName: "Slack",
      subject: "You have 3 unread messages in #general",
      body: "Hi there,\n\nYou have 3 unread messages in #general channel at Your Workspace.\n\nPreview:\n@sarah: Hey team, reminder about tomorrow's standup\n@mike: Got it, see everyone at 10am\n@lisa: Can we also discuss the Q2 roadmap?\n\nCatch up on Slack →",
      modelPrediction: "Not Spam",
      riskLevel: "safe" as const,
      indicators: [],
      detectedUrls: [
        { url: "https://slack.com/app", is_https: true, domain_reputation: "trusted" as const }
      ],
      userGuidance: {
        intent: "none",
        impact: "none",
        safety_tip: "Routine notification from Slack."
      },
      recommendedActions: {
        primary: "Safe - standard Slack notification",
        secondary: []
      }
    }
  ];
  
  const mediumTemplates = [
    {
      sender: "hr@company-benefits.net",
      senderName: "HR Department",
      subject: "Updated Employee Benefits - Action Required",
      body: "Hello Team,\n\nWe have updated our employee benefits package for 2025. Please review the changes and confirm your selections by end of this week.\n\nReview your benefits here:\nhttps://company-benefits.net/employee-portal\n\nIf you have questions, contact HR at hr@company-benefits.net.\n\nBest regards,\nHR Department",
      modelPrediction: "Not Spam",
      riskLevel: "medium" as const,
      indicators: [
        { type: "urgency", severity: "low" as const, description: "End of week deadline creates mild urgency" }
      ],
      detectedUrls: [
        { url: "https://company-benefits.net/employee-portal", is_https: true, domain_reputation: "unknown" as const }
      ],
      userGuidance: {
        intent: "Could be legitimate HR communication or targeted phishing",
        impact: "If malicious, could lead to credential theft",
        safety_tip: "Verify with your HR department through known contact channels before clicking."
      },
      recommendedActions: {
        primary: "Verify this is legitimate by contacting HR directly",
        secondary: ["Check if the domain matches your company's actual benefits provider"]
      }
    },
    {
      sender: "admin@dropbox-share.io",
      senderName: "Dropbox",
      subject: "Someone shared a file with you",
      body: "Hi,\n\nJohn Doe shared \"Q4 Financial Report.pdf\" with you.\n\nView file: https://dropbox-share.io/view/abc123\n\nThis link will expire in 7 days.\n\nThe Dropbox Team",
      modelPrediction: "Not Spam",
      riskLevel: "medium" as const,
      indicators: [
        { type: "suspicious_url", severity: "medium" as const, description: "Domain is not the official dropbox.com" }
      ],
      detectedUrls: [
        { url: "https://dropbox-share.io/view/abc123", is_https: true, domain_reputation: "suspicious" as const }
      ],
      userGuidance: {
        intent: "Possibly attempting to steal Dropbox credentials",
        impact: "Could lead to cloud storage account compromise",
        safety_tip: "Legitimate Dropbox shares come from dropbox.com domain."
      },
      recommendedActions: {
        primary: "Be cautious - verify with the sender before clicking",
        secondary: ["Check if you were expecting a file from this person", "Access Dropbox directly to check shared files"]
      }
    },
    {
      sender: "support@amazon-orders.info",
      senderName: "Amazon Customer Service",
      subject: "Problem with your recent order #112-3847592-8847291",
      body: "Hello,\n\nThere was a problem processing your recent Amazon order.\n\nOrder #112-3847592-8847291\nItem: Apple AirPods Pro\nTotal: $249.99\n\nPlease update your payment method to avoid order cancellation:\nhttps://amazon-orders.info/update-payment\n\nThank you,\nAmazon Customer Service",
      modelPrediction: "Spam",
      riskLevel: "medium" as const,
      indicators: [
        { type: "impersonation", severity: "medium" as const, description: "Uses custom domain instead of amazon.com" },
        { type: "urgency", severity: "low" as const, description: "Implies order will be cancelled without action" }
      ],
      detectedUrls: [
        { url: "https://amazon-orders.info/update-payment", is_https: true, domain_reputation: "suspicious" as const }
      ],
      userGuidance: {
        intent: "Likely attempting to steal payment information",
        impact: "Credit card fraud if credentials entered",
        safety_tip: "Amazon order issues are always handled through amazon.com directly."
      },
      recommendedActions: {
        primary: "Do not click - verify by logging into amazon.com directly",
        secondary: ["Check your actual Amazon orders", "Report suspicious email to Amazon"]
      }
    }
  ];
  
  // Generate scans spread over 5 days
  for (let day = 0; day < 5; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Generate 3-6 scans per day with varied distribution
    const scansPerDay = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < scansPerDay; i++) {
      // Randomize the hour of the scan
      const hour = 8 + Math.floor(Math.random() * 12); // Between 8 AM and 8 PM
      const minute = Math.floor(Math.random() * 60);
      date.setHours(hour, minute, Math.floor(Math.random() * 60));
      
      // Select template based on weighted distribution (more safe/medium than high risk)
      const rand = Math.random();
      let template;
      if (rand < 0.35) {
        // 35% spam/high risk
        template = spamTemplates[Math.floor(Math.random() * spamTemplates.length)];
      } else if (rand < 0.55) {
        // 20% medium risk
        template = mediumTemplates[Math.floor(Math.random() * mediumTemplates.length)];
      } else {
        // 45% safe
        template = safeTemplates[Math.floor(Math.random() * safeTemplates.length)];
      }
      
      const confidence = template.riskLevel === 'high' 
        ? 85 + Math.floor(Math.random() * 15) 
        : template.riskLevel === 'medium'
        ? 60 + Math.floor(Math.random() * 25)
        : 90 + Math.floor(Math.random() * 10);
      
      const scan: Scan = {
        id: `dummy-${day}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender: template.sender,
        senderName: template.senderName,
        subject: template.subject,
        riskLevel: template.riskLevel,
        confidence: confidence,
        timestamp: date.toISOString(),
        body: template.body,
        dangerousPhrases: [],
        reasons: template.indicators.map(ind => ind.description),
        techniques: template.indicators.map(ind => ind.type),
        links: template.detectedUrls.map(u => ({
          displayText: u.url,
          actualUrl: u.url,
          riskLevel: u.domain_reputation === 'malicious' ? 'high' as const : 
                     u.domain_reputation === 'suspicious' ? 'medium' as const : 'safe' as const,
          reason: `Domain reputation: ${u.domain_reputation}`
        })),
        recommendation: template.recommendedActions.primary,
        llmAnalysis: template.userGuidance.safety_tip,
        // New fields
        analysisId: `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        detectedUrls: template.detectedUrls,
        indicators: template.indicators,
        userGuidance: template.userGuidance,
        recommendedActions: template.recommendedActions,
        analysisSummary: template.indicators.length > 0 
          ? `This message shows ${template.indicators.length} security indicator(s). ${template.userGuidance.safety_tip}`
          : template.userGuidance.safety_tip,
        modelPrediction: template.modelPrediction,
      };
      
      scans.push(scan);
    }
  }
  
  // Sort by timestamp (newest first)
  scans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return scans;
}

export async function getAnalysisRules(): Promise<AnalysisRule[]> {
  try {
    const res = await fetch("/data/analysis-rules.json");
    return await res.json();
  } catch {
    return [];
  }
}

export function getStats() {
  const scans = getScans();
  return {
    total: scans.length,
    high: scans.filter((s) => s.riskLevel === "high").length,
    medium: scans.filter((s) => s.riskLevel === "medium").length,
    safe: scans.filter((s) => s.riskLevel === "safe").length,
  };
}

export function getScansToday(): number {
  const scans = getScans();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return scans.filter(s => new Date(s.timestamp) >= today).length;
}

export function getCategoryBreakdown() {
  const scans = getScans();
  const spam = scans.filter(s => 
    s.llmAnalysis?.toLowerCase().includes('spam') || 
    s.riskLevel === 'high'
  ).length;
  const phishing = scans.filter(s => 
    s.llmAnalysis?.toLowerCase().includes('phish') ||
    s.techniques?.some(t => t.toLowerCase().includes('phish'))
  ).length;
  const safe = scans.filter(s => s.riskLevel === 'safe').length;
  const medium = scans.filter(s => s.riskLevel === 'medium').length;
  
  return { spam, phishing, safe, medium, total: scans.length };
}

export function getWeeklyData() {
  const scans = getScans();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const thisWeek: Record<string, number> = {};
  const lastWeek: Record<string, number> = {};
  
  days.forEach(day => {
    thisWeek[day] = 0;
    lastWeek[day] = 0;
  });
  
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  
  scans.forEach(scan => {
    const scanDate = new Date(scan.timestamp);
    const dayOfWeek = days[scanDate.getDay()];
    
    if (scanDate >= weekStart) {
      thisWeek[dayOfWeek] = (thisWeek[dayOfWeek] || 0) + 1;
    } else if (scanDate >= lastWeekStart && scanDate < weekStart) {
      lastWeek[dayOfWeek] = (lastWeek[dayOfWeek] || 0) + 1;
    }
  });
  
  return days.map(day => ({
    name: day,
    thisWeek: thisWeek[day] || 0,
    lastWeek: lastWeek[day] || 0,
  }));
}
