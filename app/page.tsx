"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Truck, BarChart3, Users, Settings, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  { icon: BarChart3, label: "Analytics", desc: "Date-wise sales trends, TL leaderboard, plan breakdown and export." },
  { icon: Users, label: "Team View", desc: "Agent profiles, DRR tracking, 10k/50k customer conversion data." },
  { icon: Settings, label: "Settings", desc: "Configure sheet URL, tabs, plan points and role-based access." },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top strip */}
      <header className="flex items-center justify-between px-6 md:px-10 h-[58px] border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[30px] items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Truck strokeWidth={2.5} size={15} />
          </div>
          <span className="font-heading font-bold text-[15px] tracking-tight">BlackBuck</span>
          <span className="text-muted-foreground/50 mx-1">|</span>
          <span className="text-sm text-muted-foreground">Ops Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <Link href="/dashboard">
              <Button size="sm" className="gap-2">
                Go to Dashboard <ArrowRight size={13} />
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={handleLogin} disabled={loading} className="gap-2">
              {loading ? <Loader2 size={13} className="animate-spin" /> : null}
              Sign in with Google
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          FY 2026 • Operations Intelligence Platform
        </div>

        <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground max-w-3xl leading-tight mb-6">
          BlackBuck Sales <br />
          <span className="text-primary">Operations Dashboard</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-10">
          Real-time agent performance, team analytics, incentive tracking and DRR calculations — all in one place.
        </p>

        {session?.user ? (
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 h-12 px-8 text-base font-semibold">
              Open Dashboard <ArrowRight size={16} />
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={loading}
            className="gap-3 h-12 px-8 text-base font-semibold"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>
        )}

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 max-w-4xl w-full text-left">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Icon size={17} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{label}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-[11px] text-muted-foreground border-t border-border">
        BlackBuck Operations Dashboard • FY 2026
      </footer>
    </div>
  );
}
