import type { Scan, AnalysisRule } from "@/types/phishing";

const STORAGE_KEY = "phishlens_scans";
const INITIALIZED_KEY = "phishlens_initialized";

export async function initializeData(): Promise<void> {
  const initialized = localStorage.getItem(INITIALIZED_KEY);
  if (initialized && localStorage.getItem(STORAGE_KEY)) return;

  try {
    const res = await fetch("/data/scans.json");
    const scans: Scan[] = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    localStorage.setItem(INITIALIZED_KEY, "true");
  } catch (e) {
    console.error("Failed to load initial data", e);
  }
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
