import { useEffect, useState } from "react";
import { getScans, getStats, initializeData } from "@/lib/dataStore";
import type { Scan } from "@/types/phishing";
import {
  Share2,
  Printer,
  Download,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Stats data for the dashboard
const statsData = [
  { title: "Scans Today", value: "32.53%", change: -0.5, changeType: "negative" },
  { title: "Threats Found", value: "7,682", change: 0.1, changeType: "positive" },
  { title: "Safe Emails", value: "68.8", change: 68.8, changeType: "neutral" },
  { title: "Avg. Response", value: "2m:35s", change: 0.8, changeType: "positive" },
  { title: "Protected", value: "68.8", change: 68.8, changeType: "neutral" },
  { title: "Uptime", value: "2m:35s", change: 0.8, changeType: "positive" },
];

// Line chart data for Recharts
const performanceData = [
  { name: "SUN", thisWeek: 120, lastWeek: 80 },
  { name: "", thisWeek: 180, lastWeek: 120 },
  { name: "MON", thisWeek: 150, lastWeek: 100 },
  { name: "", thisWeek: 280, lastWeek: 180 },
  { name: "TUE", thisWeek: 220, lastWeek: 150 },
  { name: "", thisWeek: 310, lastWeek: 200 },
  { name: "WED", thisWeek: 260, lastWeek: 170 },
  { name: "", thisWeek: 250, lastWeek: 160 },
  { name: "THU", thisWeek: 200, lastWeek: 130 },
  { name: "", thisWeek: 280, lastWeek: 180 },
  { name: "FRI", thisWeek: 320, lastWeek: 210 },
  { name: "", thisWeek: 290, lastWeek: 190 },
  { name: "SAT", thisWeek: 310, lastWeek: 200 },
];

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
      <span className="text-xs text-muted-foreground font-medium">{title}</span>
      <span className="text-2xl font-bold text-card-foreground mt-0.5">{value}</span>
      <div className={cn(
        "flex items-center gap-1 text-xs mt-1",
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

function PerformanceChart() {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={performanceData}
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
  const [activeTab, setActiveTab] = useState("overview");
  const [todos, setTodos] = useState(initialTodos);
  const [marketPeriod, setMarketPeriod] = useState("This month");

  useEffect(() => {
    initializeData().then(() => {
      setScans(getScans());
      setLoading(false);
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-card rounded-xl border border-border">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Line Chart - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">
                Performance Line Chart
              </h3>
              <p className="text-sm text-muted-foreground">
                Security scanning activity over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
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
          
          <PerformanceChart />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Summary Card */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
            <h3 className="text-sm font-medium opacity-90">Status Summary</h3>
            <div className="mt-4">
              <p className="text-xs opacity-75">Protected</p>
              <p className="text-xs opacity-75">Value</p>
              <p className="text-4xl font-bold mt-1">{stats.safe || 357}</p>
            </div>
          </div>

          {/* Circular Progress Stats */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="space-y-4">
              <CircularProgress 
                percentage={Math.round((stats.safe / Math.max(stats.total, 1)) * 100) || 27}
                label="Total Scans"
                sublabel={`${stats.total || 9065} scanned`}
              />
              <div className="border-t border-border my-4" />
              <CircularProgress 
                percentage={Math.round((stats.high / Math.max(stats.total, 1)) * 100) || 8}
                label="Threats"
                sublabel={`${stats.high || 127} detected`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Overview */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-card-foreground">
              Market Overview
            </h3>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground">
              {marketPeriod}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Track phishing trends and threat patterns over time
          </p>
          
          {/* Mini trend visualization */}
          <div className="space-y-3">
            {[
              { label: "Email Phishing", value: 65, trend: "+12%" },
              { label: "URL Attacks", value: 45, trend: "-5%" },
              { label: "Credential Theft", value: 80, trend: "+23%" },
              { label: "Social Engineering", value: 35, trend: "+8%" },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    item.trend.startsWith("+") ? "text-risk-high" : "text-accent"
                  )}>
                    {item.trend}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Todo List */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-card-foreground">
              Todo List
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                  todo.completed
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                )}>
                  {todo.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className={cn(
                  "flex-1 text-sm",
                  todo.completed ? "text-muted-foreground line-through" : "text-card-foreground"
                )}>
                  {todo.text}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
