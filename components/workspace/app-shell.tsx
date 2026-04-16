"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, BookOpen, ChartColumnBig, ChevronRight, FlaskConical, LayoutDashboard, Menu, Settings, Shield, UserCircle2, Users, X } from "lucide-react";
import { useMemo } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types/dashboard";
import { roleLabel } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { useWorkspaceUiStore } from "@/lib/store/workspaceUiStore";

type AccessResponse = {
  role: UserRole;
  access?: {
    permissions?: {
      canManageDashboardConfig?: boolean;
      canManageUsers?: boolean;
    };
  };
};

type WorkspaceShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
  hidden?: boolean;
};

function useAccessRole() {
  return useQuery<AccessResponse>({
    queryKey: ["access-me"],
    queryFn: async () => {
      const res = await fetch("/api/access/me", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load access profile");
      }
      return res.json();
    },
    staleTime: 60_000,
  });
}

function buildNav(role: UserRole, canManageDashboardConfig: boolean, canManageUsers: boolean): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "TL", "AGENT"] },
    { href: "/analytics", label: "Analytics", icon: ChartColumnBig, roles: ["SUPER_ADMIN", "ADMIN", "TL", "AGENT"] },
    { href: "/team", label: "TL Workspace", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "TL", "AGENT"] },
    { href: "/profile", label: "Agent View", icon: UserCircle2, roles: ["SUPER_ADMIN", "ADMIN", "TL", "AGENT"] },
    { href: "/admin", label: "Super Admin", icon: Shield, roles: ["SUPER_ADMIN", "ADMIN"], hidden: !canManageUsers && role !== "SUPER_ADMIN" },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN", "TL"], hidden: !canManageDashboardConfig && role !== "SUPER_ADMIN" },
    { href: "/documention", label: "Guide", icon: BookOpen, roles: ["SUPER_ADMIN", "ADMIN", "TL", "AGENT"] },
  ];

  return items.filter((item) => !item.hidden && (!item.roles || item.roles.includes(role)));
}

function SidebarContent({
  role,
  items,
  onNavigate,
}: {
  role: UserRole;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="sidebar-surface flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">BlackBuck Ops</p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Control Workspace</h2>
        </div>
        {onNavigate ? (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onNavigate}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="px-5 pt-5">
        <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary shadow-none">
          {roleLabel(role)}
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-foreground text-background shadow-lg shadow-black/10"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className={cn("size-4 opacity-0 transition-opacity group-hover:opacity-100", active && "opacity-100")} />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-4">
        <div className="surface-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 border border-border">
              <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
              <AvatarFallback>{session?.user?.name?.slice(0, 2).toUpperCase() ?? "BB"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{session?.user?.name ?? "BlackBuck User"}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email ?? "Not signed in"}</p>
            </div>
            <ThemeToggle />
          </div>

          <Button variant="outline" className="mt-4 w-full justify-between rounded-2xl" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: WorkspaceShellProps) {
  const { data, isLoading } = useAccessRole();
  const pathname = usePathname();
  const role = data?.role ?? "AGENT";
  const canManageDashboardConfig =
    data?.access?.permissions?.canManageDashboardConfig ?? (role === "SUPER_ADMIN" || role === "ADMIN");
  const canManageUsers = data?.access?.permissions?.canManageUsers ?? role === "SUPER_ADMIN";
  const navItems = useMemo(
    () => buildNav(role, canManageDashboardConfig, canManageUsers),
    [role, canManageDashboardConfig, canManageUsers]
  );
  const testModeQuery = useQuery({
    queryKey: ["test-mode"],
    queryFn: async () => {
      const res = await fetch("/api/test-mode", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load test mode state");
      }
      return res.json() as Promise<{ enabled: boolean; snapshotAt: string | null; snapshotReady: boolean }>;
    },
    staleTime: 15_000,
  });
  const mobileSidebarOpen = useWorkspaceUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useWorkspaceUiStore((state) => state.setMobileSidebarOpen);
  const currentNav = navItems.find((item) => item.href === pathname);
  const breadcrumb = currentNav?.label ?? "Workspace";

  return (
    <div className="app-shell-background min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1700px] gap-6 p-4 md:p-6">
        <aside className="surface-panel hidden h-[calc(100vh-3rem)] w-[290px] shrink-0 overflow-hidden rounded-[2rem] lg:sticky lg:top-6 lg:block">
          <SidebarContent role={role} items={navItems} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="surface-panel sticky top-0 z-20 mb-6 flex items-center justify-between rounded-[2rem] px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="icon" className="rounded-2xl">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                  <SidebarContent role={role} items={navItems} onNavigate={() => setMobileSidebarOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Workspace / {breadcrumb}</p>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  {currentNav?.label ?? "Sales intelligence and role-based operations"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden rounded-full px-3 py-1 text-xs font-medium md:inline-flex">
                {isLoading ? "Loading access" : roleLabel(role)}
              </Badge>
              <Button variant="ghost" size="icon" className="rounded-2xl">
                <Bell className="size-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      {(role === "SUPER_ADMIN" || role === "ADMIN") && (
        <div className="fixed bottom-6 right-6 z-40">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="rounded-full shadow-lg" variant="secondary">
                <FlaskConical className="mr-2 size-4" />
                Test data
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Test mode</p>
                <p className="text-xs text-muted-foreground">
                  Snapshot raw data once and reuse it for all dashboard views.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Use snapshot</p>
                  <p className="text-xs text-muted-foreground">
                    {testModeQuery.data?.snapshotAt ? `Saved ${testModeQuery.data.snapshotAt}` : "No snapshot yet"}
                  </p>
                </div>
                <Switch
                  checked={testModeQuery.data?.enabled ?? false}
                  onCheckedChange={async (value) => {
                    try {
                      const res = await fetch("/api/test-mode", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: value, snapshot: value }),
                      });
                      if (!res.ok) throw new Error("Unable to update test mode");
                      await testModeQuery.refetch();
                      toast(value ? "Test mode enabled" : "Test mode disabled", {
                        description: value
                          ? "Snapshot saved. Dashboard will use stored raw data."
                          : "Dashboard will use live sheet data.",
                      });
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "Unable to update test mode";
                      toast.error("Test mode failed", { description: message });
                    }
                  }}
                />
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
                Stored at: <span className="font-medium text-foreground">/public/trash/test-raw-snapshot.json</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
