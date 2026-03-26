"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LockKeyhole } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch {
      setIsLoggingIn(false);
    }
  };

  const showOverlay = mounted && status === "unauthenticated";

  return (
    <>
      <div className={showOverlay ? "pointer-events-none blur-md opacity-30 transition-all duration-700 ease-in-out select-none flex-1 flex flex-col h-full overflow-hidden" : "transition-all duration-500 flex-1 flex flex-col h-full"}>
        {children}
      </div>

      <Dialog open={showOverlay} modal={true}>
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden z-[99999]" 
          onInteractOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="pt-2 pb-1">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="size-6" />
            </div>
            <DialogTitle className="font-heading text-2xl text-center">Authentication Required</DialogTitle>
            <DialogDescription className="text-[13px] text-center leading-relaxed mt-2 max-w-[280px] mx-auto text-muted-foreground">
              Please sign in securely with your corporate Google workspace account to unlock the operations dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 pt-4 px-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 h-12 shadow-sm font-semibold tracking-wide transition-all hover:bg-muted/50"
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground mr-1" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              {isLoggingIn ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
