import {
  ShieldAlert,
  Mail,
  Link2,
  Brain,
  Eye,
  Lock,
  AlertTriangle,
  UserX,
  BookOpen,
  Lightbulb,
} from "lucide-react";

const techniques = [
  {
    icon: AlertTriangle,
    title: "Urgency & Fear",
    color: "text-risk-high",
    bgColor: "bg-risk-high/10",
    description:
      "Phishing emails often create a sense of urgency ('Your account will be suspended in 24 hours!') or fear ('Unauthorized access detected') to pressure you into acting without thinking.",
    examples: [
      "Act now or your account will be closed",
      "Unusual sign-in detected — verify immediately",
      "Your payment failed — update within 24 hours",
    ],
  },
  {
    icon: UserX,
    title: "Impersonation",
    color: "text-risk-medium",
    bgColor: "bg-risk-medium/10",
    description:
      "Attackers pretend to be trusted organizations like banks, tech companies, or even your employer. They use lookalike domains and official-looking templates.",
    examples: [
      "paypa1.com instead of paypal.com (number 1 vs letter l)",
      "micros0ft.com (zero instead of o)",
      "support@company-secure.net (fake domain)",
    ],
  },
  {
    icon: Link2,
    title: "Malicious Links",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description:
      "Links may display one URL but redirect to another. Hovering over a link reveals the actual destination. Shortened URLs (bit.ly) are also used to hide destinations.",
    examples: [
      "Display: 'Click here to verify' → goes to fake-login.com",
      "Shortened links that hide the real domain",
      "Links with misspelled domain names",
    ],
  },
  {
    icon: Brain,
    title: "Social Engineering",
    color: "text-accent",
    bgColor: "bg-accent/10",
    description:
      "Attackers exploit human psychology — curiosity, helpfulness, authority, and greed. They craft messages that appeal to emotions rather than logic.",
    examples: [
      "Congratulations! You've won a prize (greed)",
      "Your CEO needs this done urgently (authority)",
      "Please help me transfer funds (helpfulness)",
    ],
  },
];

const tips = [
  {
    icon: Eye,
    title: "Check the Sender's Email",
    text: "Look at the actual email address, not just the display name. Legitimate companies use their official domain.",
  },
  {
    icon: Link2,
    title: "Hover Before You Click",
    text: "Always hover over links to see the actual URL before clicking. If it doesn't match the claimed destination, don't click.",
  },
  {
    icon: Lock,
    title: "Never Share Sensitive Info via Email",
    text: "Legitimate organizations will never ask for passwords, SSNs, or bank details via email.",
  },
  {
    icon: Mail,
    title: "Verify Through Official Channels",
    text: "If an email seems suspicious, contact the organization directly through their official website or phone number.",
  },
  {
    icon: ShieldAlert,
    title: "Look for Generic Greetings",
    text: "'Dear Customer' or 'Dear User' instead of your name is a red flag. Legitimate companies usually address you by name.",
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Phishing Awareness
          </h2>
          <p className="text-sm text-muted-foreground">
            Learn how attackers manipulate users and how to protect yourself
          </p>
        </div>
      </div>

      {/* Techniques Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-risk-high" />
          <h3 className="text-lg font-semibold text-foreground">
            Common Phishing Techniques
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {techniques.map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.bgColor}`}>
                  <t.icon className={`h-5 w-5 ${t.color}`} />
                </div>
                <h4 className="font-semibold text-card-foreground">
                  {t.title}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t.description}</p>
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Examples
                </p>
                {t.examples.map((ex, i) => (
                  <p
                    key={i}
                    className="flex gap-2 text-xs text-card-foreground"
                  >
                    <span className="text-primary">→</span>
                    <span className="font-mono">{ex}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            How to Stay Protected
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {tips.map((tip, index) => (
              <div
                key={tip.title}
                className="flex gap-4 p-5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <tip.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-card-foreground mb-1">
                    {index + 1}. {tip.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Reference Card */}
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">
              Quick Reference: Red Flags
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-high" />
                Urgent deadlines or threats
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-high" />
                Requests for sensitive data
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
                Suspicious email addresses
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
                Grammar or spelling errors
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
                Mismatched URLs
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
                Generic greetings
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
