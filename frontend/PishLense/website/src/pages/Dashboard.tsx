import { useEffect, useState } from "react";
import { getScans, getStats, initializeData, getScansToday, getCategoryBreakdown, getWeeklyData } from "@/lib/dataStore";
import type { Scan } from "@/types/phishing";
import {
  TrendingDown,
  TrendingUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Stats data will be computed from real localStorage data

// Todo items
const initialTodos = [
  { id: 1, text: "Review flagged emails", completed: true },
  { id: 2, text: "Update threat database", completed: false },
  { id: 3, text: "Configure alert settings", completed: false },
  { id: 4, text: "Weekly security report", completed: false },
];

function StatCard({ title, value, change, changeType }: { 
  title: string; 
  value: string; 
  change: number;
  changeType: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{title}</span>
      <span className="text-xl sm:text-2xl font-bold text-card-foreground mt-0.5">{value}</span>
      <div className={cn(
        "flex items-center gap-1 text-[10px] sm:text-xs mt-1",
        changeType === "negative" ? "text-risk-high" : 
        changeType === "positive" ? "text-accent" : "text-muted-foreground"
      )}>
        {changeType === "negative" ? (
          <TrendingDown className="h-3 w-3" />
        ) : changeType === "positive" ? (
          <TrendingUp className="h-3 w-3" />
        ) : null}
        <span>{changeType === "neutral" ? `${change}` : `${change > 0 ? "+" : ""}${change}%`}</span>
      </div>
    </div>
  );
}

function PerformanceChart({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={(value) => value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--card-foreground))' }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
          />
          <Area
            type="monotone"
            dataKey="lastWeek"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeOpacity={0.4}
            fill="url(#colorLastWeek)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="thisWeek"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#colorThisWeek)"
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CircularProgress({ percentage, label, sublabel }: { 
  percentage: number; 
  label: string;
  sublabel: string;
}) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-card-foreground">{percentage}%</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState(initialTodos);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = () => {
      const allScans = getScans();
      setScans(allScans);
      
      const stats = getStats();
      const scansToday = getScansToday();
      const categories = getCategoryBreakdown();
      const weeklyData = getWeeklyData();
      
      // Calculate stats for display
      const totalScans = stats.total || 0;
      const scansYesterday = allScans.filter(s => {
        const scanDate = new Date(s.timestamp);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return scanDate >= yesterday && scanDate < today;
      }).length;
      
      const scansTodayChange = scansYesterday > 0 
        ? ((scansToday - scansYesterday) / scansYesterday * 100).toFixed(4)
        : (scansToday > 0 ? "100.0000" : "0.0000");
      
      const threatsFound = stats.high + stats.medium;
      const safePercentage = totalScans > 0 ? ((stats.safe / totalScans) * 100).toFixed(4) : "0";
      const threatsPercentage = totalScans > 0 ? ((threatsFound / totalScans) * 100).toFixed(4) : "0";
      
      setStatsData([
        { 
          title: "Scans Today", 
          value: scansToday.toString(), 
          change: parseFloat(scansTodayChange as string), 
          changeType: parseFloat(scansTodayChange as string) >= 0 ? "positive" : "negative" 
        },
        { 
          title: "Threats Found", 
          value: threatsFound.toString(), 
          change: parseFloat(threatsPercentage), 
          changeType: "positive" 
        },
        { 
          title: "Safe Emails", 
          value: safePercentage + "%", 
          change: parseFloat(safePercentage), 
          changeType: "neutral" 
        },
        { 
          title: "Total Scans", 
          value: totalScans.toString(), 
          change: 0, 
          changeType: "neutral" 
        },
        { 
          title: "Spam Detected", 
          value: categories.spam.toString(), 
          change: 0, 
          changeType: "neutral" 
        },
        { 
          title: "Phishing", 
          value: categories.phishing.toString(), 
          change: 0, 
          changeType: "neutral" 
        },
      ]);
      
      setPerformanceData(weeklyData);
      setLoading(false);
    };
    
    initializeData().then(loadData);
    
    // Reload data every 5 seconds to catch extension updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = getStats();

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs and Action Buttons */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1 border-b border-border sm:border-0">
          {["Overview", "Analytics", "Reports", "More"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg sm:rounded-lg transition-colors",
                activeTab === tab.toLowerCase()
                  ? "bg-card text-card-foreground border-b-2 border-primary sm:border-0 sm:bg-primary sm:text-primary-foreground"
                  : "text-muted-foreground hover:text-card-foreground hover:bg-muted/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div> */}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-card rounded-xl border border-border p-3 sm:p-4"
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
            />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Performance Line Chart - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">
                Scanning Activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Your email scanning activity this week vs last week
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                This week
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary/40" />
                Last week
              </div>
            </div>
          </div>
          
          {performanceData.every(d => d.thisWeek === 0 && d.lastWeek === 0) ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">No scan data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Use the extension to scan emails or seed demo data from Settings</p>
              </div>
            </div>
          ) : (
            <PerformanceChart data={performanceData} />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Status Summary Card */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 sm:p-6 text-primary-foreground shadow-lg">
            <h3 className="text-sm font-medium opacity-90">Protection Status</h3>
            <div className="mt-3 sm:mt-4">
              <p className="text-xs opacity-75">Emails Verified Safe</p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">{stats.safe}</p>
              <p className="text-xs opacity-75 mt-2">out of {stats.total} total scans</p>
            </div>
          </div>

          {/* Circular Progress Stats */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <div className="space-y-4">
              <CircularProgress 
                percentage={stats.total > 0 ? Math.round((stats.safe / stats.total) * 100) : 0}
                label="Safe Rate"
                sublabel={`${stats.safe} of ${stats.total} safe`}
              />
              <div className="border-t border-border my-4" />
              <CircularProgress 
                percentage={stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0}
                label="Threat Rate"
                sublabel={`${stats.high} threats detected`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Threat Overview */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-card-foreground">
              Threat Overview
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              All time
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Breakdown of detected threats by category
          </p>
          
          {/* Threat visualization */}
          <div className="space-y-3">
            {[
              { label: "High Risk (Spam/Phishing)", value: stats.total > 0 ? (stats.high / stats.total) * 100 : 0, count: stats.high, color: "bg-risk-high" },
              { label: "Medium Risk", value: stats.total > 0 ? (stats.medium / stats.total) * 100 : 0, count: stats.medium, color: "bg-risk-medium" },
              { label: "Safe", value: stats.total > 0 ? (stats.safe / stats.total) * 100 : 0, count: stats.safe, color: "bg-risk-safe" },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs sm:text-sm">{item.label}</span>
                  <span className="text-xs font-medium text-card-foreground">
                    {item.count} ({item.value.toFixed(4)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${Math.max(item.value, 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-card-foreground">
              Quick Actions
            </h3>
          </div>
          
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors shrink-0",
                  todo.completed
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                )}>
                  {todo.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className={cn(
                  "flex-1 text-xs sm:text-sm",
                  todo.completed ? "text-muted-foreground line-through" : "text-card-foreground"
                )}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
          
          {stats.total === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed border-border">
              <p className="text-xs text-muted-foreground text-center">
                💡 Tip: Go to <span className="font-medium text-card-foreground">Settings</span> and click "Seed Demo Data" to see the dashboard with sample data!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
