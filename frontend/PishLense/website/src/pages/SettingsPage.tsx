import { useState } from "react";
import { clearAllData, initializeData } from "@/lib/dataStore";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, CheckCircle, Settings, Info, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const [cleared, setCleared] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    clearAllData();
    await initializeData();
    setLoading(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your preferences and local data
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">Data Management</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-card-foreground mb-1">
              Clear All Local Data
            </h4>
            <p className="text-sm text-muted-foreground">
              This will remove all scan history from localStorage and reload the
              initial demo data. This action cannot be undone.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={handleClear}
            className="gap-2"
            disabled={cleared || loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Resetting...
              </>
            ) : cleared ? (
              <>
                <CheckCircle className="h-4 w-4" /> Data Reset Successfully
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Clear & Reset Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* About Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">About PhishLens</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">PhishLens</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0 — Demo</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              PhishLens is a phishing detection visualization dashboard. It reads 
              analysis results from browser localStorage and displays them in an
              easy-to-understand format.
            </p>
            <p>
              This is a demo/expo project. All data shown is simulated and stored
              locally in your browser.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-card-foreground">Note:</span> This 
              dashboard is designed to work with the PhishLens browser extension 
              for real-time email analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
