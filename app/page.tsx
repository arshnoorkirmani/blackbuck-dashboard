"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, ChartColumnBig, Loader2, LockKeyhole, Settings2, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const features = [
  {
    title: "Agent-first dashboard",
    description: "Search any accessible agent, filter results instantly, and pair charts with matching tables.",
    icon: ChartColumnBig,
  },
  {
    title: "TL workspace",
    description: "View the team roster, compare performers, and lock editing automatically when permissions are disabled.",
    icon: Users,
  },
  {
    title: "Super admin controls",
    description: "Manage user roles, permission flags, configuration, and governance from one professional control center.",
    icon: Shield,
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    setAuthError("");
    await signIn("google", { callbackUrl: "/dashboard" });
    setLoadingGoogle(false);
  };

  const handleCredentials = async () => {
    setLoadingCredentials(true);
    setAuthError("");
    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setAuthError("Invalid super admin credentials.");
        toast.error("Invalid super admin credentials");
        return;
      }

      toast.success("Super admin access granted");
      window.location.href = result?.url ?? "/admin";
    } finally {
      setLoadingCredentials(false);
    }
  };

  return (
    <div className="landing-background min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 md:px-8 md:py-8">
        <header className="surface-panel flex items-center justify-between rounded-[2rem] px-5 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">BlackBuck Ops</p>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Sales Intelligence Platform</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user ? (
              <Link href="/dashboard">
                <Button className="rounded-2xl">
                  Open workspace
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            ) : null}
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr,0.95fr]">
          <section className="space-y-6">
            <Badge className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary shadow-none">
              Redesigned workspace
            </Badge>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                Professional dashboard, analytics, TL operations, and super admin control.
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Built with shadcn UI, role-aware access, theme switching, reusable pages, and dashboard data wired from
                the sheets-backed backend flow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="surface-panel rounded-[1.75rem]">
                    <CardHeader>
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>

          <Card className="surface-panel rounded-[2rem]">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary shadow-none">
                Login options
              </Badge>
              <CardTitle className="text-2xl">Choose how you want to access the platform</CardTitle>
              <CardDescription>
                Google is for standard business users. Super admin uses credentials defined on the server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="google" className="space-y-6">
                <TabsList className="grid h-12 grid-cols-2 rounded-2xl">
                  <TabsTrigger value="google" className="rounded-2xl">
                    Workspace Login
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="rounded-2xl">
                    Super Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="google" className="space-y-4">
                  <Card className="surface-panel-muted rounded-[1.5rem] shadow-none">
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-foreground">Google Workspace sign-in</p>
                        <p className="text-sm text-muted-foreground">
                          Best for agents, TLs, and admins who need live sheet-backed access and dashboard data.
                        </p>
                      </div>
                      <Button onClick={handleGoogle} disabled={loadingGoogle} className="h-12 w-full rounded-2xl">
                        {loadingGoogle ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
                        Continue with Google
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                  <Card className="surface-panel-muted rounded-[1.5rem] shadow-none">
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-foreground">Super admin credentials</p>
                        <p className="text-sm text-muted-foreground">
                          Use the email and password stored in the server environment to open the control center.
                        </p>
                      </div>
                      <Input
                        type="email"
                        placeholder="super admin email"
                        value={credentials.email}
                        onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                        className="h-12 rounded-2xl"
                      />
                      <Input
                        type="password"
                        placeholder="super admin password"
                        value={credentials.password}
                        onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                        className="h-12 rounded-2xl"
                      />
                      <Button onClick={handleCredentials} disabled={loadingCredentials} className="h-12 w-full rounded-2xl">
                        {loadingCredentials ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Shield className="mr-2 size-4" />}
                        Sign in as Super Admin
                      </Button>
                      {authError ? (
                        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                          {authError}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="surface-panel-muted mt-6 rounded-[1.5rem] p-5">
                <div className="flex items-start gap-3">
                  <Settings2 className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">What you get after login</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Dashboard with agent search, analytics with drill-down filters, TL workspace, agent profile view,
                      settings, documentation, and super admin governance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
