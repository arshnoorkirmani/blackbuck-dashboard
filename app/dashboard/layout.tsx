import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
