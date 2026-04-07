"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, Users, Settings, Truck,
  LogOut, ChevronRight, X, Bell, Menu,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { GlobalFilterPanel } from "@/components/dashboard/GlobalFilterPanel";
import { AgentDetailsDialog } from "@/components/dashboard/modals/AgentDetailsDialog";
import { CustomerListDialog } from "@/components/dashboard/modals/CustomerListDialog";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "AGENT";

  const roleConfig: Record<string, { color: string; bg: string; border: string }> = {
    ADMIN: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    TL:    { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
    AGENT: { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
  };
  const rc = roleConfig[role] ?? roleConfig.AGENT;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo area */}
      <div className="flex items-center justify-between px-5 h-[60px] border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-black shadow-lg shadow-primary/20 shrink-0">
            <Truck strokeWidth={2.5} size={15} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-[13px] font-bold tracking-tight">BlackBuck</span>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">OPS DASHBOARD</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 pt-5 pb-3">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-widest uppercase border ${rc.color} ${rc.bg} ${rc.border}`}>
          <span className="size-1.5 rounded-full bg-current opacity-70 animate-pulse" />
          {role}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto pb-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-primary nav-active-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="opacity-40" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-border" />

      {/* User section */}
      <div className="p-3 space-y-1 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
          <div className="size-8 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-primary">{session?.user?.name?.[0] ?? "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">{session?.user?.name ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email ?? ""}</p>
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  );
}

function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const page = pathname.split("/")[1] || "dashboard";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[60px] border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <Truck size={13} className="text-primary" />
          <span className="text-primary/60">/</span>
          <span className="text-foreground font-medium capitalize">{page}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary animate-pulse" />
        </button>
        <GlobalFilterPanel />
      </div>
    </header>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] min-h-screen border-r border-border shrink-0 fixed left-0 top-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-[240px] border-r border-border z-50"
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-[240px] min-h-screen">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global modals */}
      <AgentDetailsDialog agentsDataMap={[]} />
      <CustomerListDialog transactions={[]} />
    </div>
  );
}
