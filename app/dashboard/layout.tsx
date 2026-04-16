import { AppShell } from "@/components/workspace/app-shell";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
