"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Loader2, LockKeyhole, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleGoogleLogin = async () => {
    setAuthError("");
    setIsLoggingIn(true);
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        const message = "Super admin login failed. Check the configured credentials.";
        setAuthError(message);
        toast.error(message);
        return;
      }

      toast.success("Signed in successfully.");
      window.location.href = pathname.startsWith("/admin") ? pathname : "/admin";
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPublicRoute = pathname === "/";
  const showOverlay = status === "unauthenticated" && !isPublicRoute;

  return (
    <>
      <div
        className={
          showOverlay
            ? "pointer-events-none flex h-full flex-1 flex-col overflow-hidden blur-md opacity-30 transition-all duration-700 ease-in-out select-none"
            : "flex h-full flex-1 flex-col transition-all duration-500"
        }
      >
        {children}
      </div>

      <Dialog open={showOverlay} modal>
        <DialogContent
          className="sm:max-w-xl [&>button]:hidden"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader className="space-y-3 pt-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="size-6" />
            </div>
            <DialogTitle className="text-center text-2xl">Authentication required</DialogTitle>
            <DialogDescription className="mx-auto max-w-md text-center text-sm leading-relaxed">
              Sign in with Google for live dashboard access, or use the super admin credentials defined in the server
              environment for governance pages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Button className="h-12 w-full rounded-2xl" onClick={handleGoogleLogin} disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
              Continue with Google
            </Button>

            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Super admin credentials</p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="super admin email"
                  value={credentials.email}
                  onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="super admin password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
                <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={handleSuperAdminLogin} disabled={isLoggingIn}>
                  <Shield className="mr-2 size-4" />
                  Sign in as Super Admin
                </Button>
              </div>
            </div>

            {authError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {authError}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
