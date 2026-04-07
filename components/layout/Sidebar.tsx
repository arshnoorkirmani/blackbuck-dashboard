"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  Truck,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "AGENT";

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-card border-r border-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-[58px] border-b border-border">
        <div className="flex size-[30px] items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shrink-0">
          <Truck strokeWidth={2.5} size={15} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-[13px] font-bold tracking-tight text-foreground">BlackBuck</span>
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Ops Dashboard</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 pt-4 pb-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[10px] font-medium tracking-wider uppercase border
          ${role === "ADMIN" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
            role === "TL" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
            "bg-primary/10 text-primary border-primary/20"}`}>
          {role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 pt-2 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-2 border-t border-border mt-2">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {session?.user?.name?.[0] ?? "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-foreground truncate">{session?.user?.name ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email ?? ""}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={13} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
