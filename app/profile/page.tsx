import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shared/app-header";
import Image from "next/image";

export const metadata = {
  title: "Agent Profile",
};

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <AppHeader />
      <main className="flex-1 w-full max-w-4xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
        <div className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">My Profile</h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Account Information & Activity</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-8 items-start">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="rounded-full border-4 border-background shadow-lg overflow-hidden size-32 bg-muted relative">
              {session.user.image ? (
                <Image src={session.user.image} alt={session.user.name || "Profile"} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary font-heading text-4xl font-bold">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="mt-5 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" /> Active Agent
            </div>
          </div>

          <div className="flex-1 relative z-10 pt-2 space-y-6 w-full">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">{session.user.name}</h2>
              <p className="font-mono text-sm text-muted-foreground tracking-wide mt-1.5">{session.user.email}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border border-border/50 shadow-sm flex flex-col justify-center">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Agent Role</p>
                <p className="font-medium text-[15px] text-foreground">Field Operations</p>
              </div>
              <div className="p-4 rounded-xl bg-background border border-border/50 shadow-sm flex flex-col justify-center">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Authentication</p>
                <p className="font-medium text-[15px] text-foreground flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google OAuth
                </p>
              </div>
            </div>
            
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm mt-4 relative overflow-hidden flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between group">
               <div>
                  <p className="font-heading font-semibold text-foreground mb-1">Device Sessions</p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">This device is currently authenticated via Google Workspace.</p>
               </div>
               <div className="shrink-0">
                 <span className="font-mono text-[10px] text-muted-foreground/50 tracking-wider">SECURE</span>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
