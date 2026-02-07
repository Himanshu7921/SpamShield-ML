import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  History,
  Search,
  BookOpen,
  Settings,
  Shield,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/scans", label: "Scan History", icon: History },
  { to: "/analyze", label: "Analyze", icon: Search },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:static border-r border-sidebar-border",
          sidebarCollapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border h-16",
          sidebarCollapsed ? "justify-center px-3" : "justify-between px-5"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-sidebar-primary">
                PhishLens
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  sidebarCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (when collapsed) */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex justify-center p-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Theme toggle at bottom */}
        <div className={cn(
          "border-t border-sidebar-border p-3",
          sidebarCollapsed ? "flex justify-center" : ""
        )}>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            {!sidebarCollapsed && (theme === "dark" ? "Light" : "Dark")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur-sm px-4 h-16 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-foreground hover:text-primary transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              {getGreeting()}!
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Welcome to your phishing detection dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground transition-colors hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-risk-high text-[10px] font-medium text-white">
                2
              </span>
            </button>
            
            <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">
                Active
              </span>
            </div>

            <div className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
              PL
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
