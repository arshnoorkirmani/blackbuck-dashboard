'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppHeader } from '@/components/shared/app-header';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  User,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TL', 'AGENT'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3,       roles: ['ADMIN', 'TL', 'AGENT'] },
  { href: '/team',      label: 'Team',      icon: Users,           roles: ['ADMIN', 'TL', 'AGENT'] },
  { href: '/settings',  label: 'Settings',  icon: Settings,        roles: ['ADMIN', 'TL'] },
];

const ROLE_CONFIG = {
  ADMIN: { label: 'Admin',     icon: Shield, color: 'bg-amber-500/15 text-amber-500 border-amber-500/20' },
  TL:    { label: 'Team Lead', icon: Users,  color: 'bg-blue-500/15 text-blue-500 border-blue-500/20' },
  AGENT: { label: 'Agent',     icon: User,   color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const role = (session as any)?.role as keyof typeof ROLE_CONFIG | undefined;
  const roleInfo = role ? ROLE_CONFIG[role] : ROLE_CONFIG.AGENT;
  const RoleIcon = roleInfo.icon;
  const currentRole = role ?? 'AGENT';

  const visibleItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(currentRole));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
        <aside
          className={`hidden md:flex flex-col border-r border-border bg-card/30 backdrop-blur-sm transition-all duration-300 ease-in-out sticky top-[64px] h-[calc(100vh-64px)] overflow-hidden ${
            collapsed ? 'w-[72px]' : 'w-[240px]'
          }`}
        >
          {/* Collapse toggle */}
          <div className="flex items-center justify-end px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto custom-scrollbar">
            {visibleItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;

              return (
                <Link key={href} href={href} title={collapsed ? label : undefined}>
                  <div
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary-rgb),0.1)]'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      className={`size-[18px] shrink-0 transition-all duration-300 ${
                        isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {!collapsed && <span className="truncate tracking-tight">{label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Role badge at bottom */}
          {!collapsed && (
            <div className="px-3 py-4 border-t border-border">
              <Badge variant="outline" className={`w-full justify-center gap-1.5 py-1.5 text-[11px] font-semibold ${roleInfo.color}`}>
                <RoleIcon className="size-3" />
                {roleInfo.label}
              </Badge>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-4 border-t border-border">
              <div className={`flex items-center justify-center size-8 rounded-full ${roleInfo.color}`}>
                <RoleIcon className="size-3.5" />
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-muted/5 custom-scrollbar">
          <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 min-h-full flex flex-col w-full">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
      <nav className="md:hidden flex items-center justify-around border-t border-border bg-card/80 backdrop-blur-md px-2 py-2.5 sticky bottom-0 z-50">
        {visibleItems.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={`flex flex-col items-center gap-1 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <Icon className="size-5" />
                <span className="text-[10px] font-semibold">{label.split(' ')[0]}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
