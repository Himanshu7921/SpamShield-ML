import type { Scan, AnalysisRule } from "@/types/phishing";

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
