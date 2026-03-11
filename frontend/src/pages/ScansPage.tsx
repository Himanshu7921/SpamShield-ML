import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getScans, initializeData } from "@/lib/dataStore";
import type { Scan, RiskLevel } from "@/types/phishing";
import { RiskBadge } from "@/components/RiskBadge";
import { Clock, Search, Filter, Mail, AlertTriangle, Shield, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const filters: { label: string; value: RiskLevel | "all" }[] = [
  { label: "All", value: "all" },
  { label: "High Risk", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Safe", value: "safe" },
];

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScans = async () => {
      await initializeData();
      // If opened with a scan payload from extension, decode and add it
      try {
        const params = new URLSearchParams(window.location.search);
        const scanParam = params.get('scan');
        if (scanParam) {
          try {
            const b64 = decodeURIComponent(scanParam);
            const json = decodeURIComponent(escape(window.atob(b64)));
            const parsed = JSON.parse(json);
            if (parsed && parsed.id) {
              // add to store and update list
              // import addScan dynamically to avoid circulars
              const { addScan } = await import('@/lib/dataStore');
              addScan(parsed);
              // remove scan param from URL
              const url = new URL(window.location.href);
              url.searchParams.delete('scan');
              window.history.replaceState({}, document.title, url.toString());
            }
          } catch (e) {
            console.warn('Failed to decode scan param', e);
          }
        }
      } catch (e) {}
      setScans(getScans());
      setLoading(false);
    };
    
    loadScans();
    
    // Auto-refresh every 3 seconds to catch extension updates
    const interval = setInterval(() => {
      setScans(getScans());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const filtered = scans.filter((s) => {
    if (filter !== "all" && s.riskLevel !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.subject.toLowerCase().includes(q) ||
        s.sender.toLowerCase().includes(q) ||
        s.senderName.toLowerCase().includes(q) ||
        (s.modelPrediction && s.modelPrediction.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate stats
  const stats = {
    total: scans.length,
    high: scans.filter(s => s.riskLevel === 'high').length,
    medium: scans.filter(s => s.riskLevel === 'medium').length,
    safe: scans.filter(s => s.riskLevel === 'safe').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">
              {stats.total} total scans
            </span>
            {stats.high > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {stats.high} threats
              </span>
            )}
            {stats.safe > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {stats.safe} safe
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live sync with extension</span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by subject, sender..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    filter === f.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scan List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Loading scans...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-card-foreground">No scans found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? "Try adjusting your search or filters" : "Start by analyzing an email"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((scan) => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50 group"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-semibold text-lg ${
                  scan.riskLevel === 'high'
                    ? 'bg-risk-high/10 text-risk-high'
                    : scan.riskLevel === 'medium'
                    ? 'bg-risk-medium/10 text-risk-medium'
                    : 'bg-risk-safe/10 text-risk-safe'
                }`}>
                  {scan.riskLevel === 'high' ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : scan.riskLevel === 'safe' ? (
                    <Shield className="h-6 w-6" />
                  ) : (
                    scan.senderName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {scan.subject}
                    </p>
                    {/* {scan.modelPrediction && (
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        scan.modelPrediction.toLowerCase().includes('spam') && !scan.modelPrediction.toLowerCase().includes('not')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {scan.modelPrediction}
                      </span>
                    )} */}
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-1">
                    {scan.senderName} • {scan.sender}
                  </p>
                  {/* Show indicators count if present */}
                  {scan.indicators && scan.indicators.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <span className="text-[10px] text-orange-600 font-medium">
                        {scan.indicators.length} indicator{scan.indicators.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RiskBadge level={scan.riskLevel} />
                  <div className="hidden md:flex flex-col items-end gap-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
