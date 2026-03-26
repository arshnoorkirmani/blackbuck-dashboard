"use client";

import { useState } from "react";
import { Truck, Loader2 } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { UserNav } from "./user-nav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AppHeader() {
  const { data: session } = useSession();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch (err) {
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-border bg-card px-7">
      <Link href="/">
        <div className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex size-[30px] items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Truck strokeWidth={2.5} size={16} />
          </div>
          <span className="font-medium">BlackBuck</span> <span className="mx-1 text-muted-foreground/50">|</span>
          <span className="font-heading text-[15px] font-bold tracking-tight text-foreground">
            <span className="font-semibold text-muted-foreground">Operations</span>
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground mr-1 hidden sm:block">
          FY 2026
        </span>
        {session?.user ? (
          <UserNav user={session.user} />
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="default" size="sm" className="h-8 rounded-full px-5 text-[11px] font-semibold tracking-wide bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
                Log in securely
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Authentication required</DialogTitle>
                <DialogDescription className="text-sm">
                  Sign in with your Google workspace account to access the operations dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 h-11 transition-all"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground mr-1" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  )}
                  Continue with Google
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
}
