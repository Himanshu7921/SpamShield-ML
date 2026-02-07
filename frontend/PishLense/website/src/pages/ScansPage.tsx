import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getScans, initializeData } from "@/lib/dataStore";
import type { Scan, RiskLevel } from "@/types/phishing";
import { RiskBadge } from "@/components/RiskBadge";
import { Clock, Search, Filter, Mail } from "lucide-react";
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
    initializeData().then(() => {
      setScans(getScans());
      setLoading(false);
    });
  }, []);

  const filtered = scans.filter((s) => {
    if (filter !== "all" && s.riskLevel !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.subject.toLowerCase().includes(q) ||
        s.sender.toLowerCase().includes(q) ||
        s.senderName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <p className="text-sm text-muted-foreground">
            {scans.length} total emails scanned
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Synced with browser extension</span>
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
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-medium ${
                  scan.riskLevel === 'high'
                    ? 'bg-risk-high/10 text-risk-high'
                    : scan.riskLevel === 'medium'
                    ? 'bg-risk-medium/10 text-risk-medium'
                    : 'bg-risk-safe/10 text-risk-safe'
                }`}>
                  {scan.senderName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {scan.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {scan.senderName} • {scan.sender}
                  </p>
                </div>
                <RiskBadge level={scan.riskLevel} />
                <span className="hidden text-xs text-muted-foreground md:flex items-center gap-1.5 shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(scan.timestamp).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
