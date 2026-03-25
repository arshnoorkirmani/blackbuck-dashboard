import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';

export default function Dashboard() {
  return (
    <div className="flex flex-col flex-1 w-full bg-background min-h-screen font-['DM_Sans',sans-serif]">
      <AppHeader />
      
      <main className="flex-1 p-8 md:p-12 lg:p-16 max-w-6xl mx-auto w-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="mb-12">
          <h1 className="text-3xl md:text-[42px] font-['Syne',sans-serif] font-bold text-foreground mb-3 tracking-normal">
            Welcome back, Field Agent
          </h1>
          <p className="font-['JetBrains_Mono',monospace] text-[12px] text-muted-foreground tracking-wider uppercase">
            Operations Dashboard • Overview
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/form" className="group relative block bg-card border border-border shadow-sm rounded-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#F59E0B]/50 hover:bg-card hover:shadow-[0_8px_30px_rgb(245,158,11,0.12)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]">
            <div className="h-14 w-14 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mb-6 group-hover:scale-[1.02] transition-transform duration-300">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            
            <h2 className="font-['Syne',sans-serif] font-bold text-2xl text-card-foreground mb-3 group-hover:text-[#F59E0B] transition-colors">
              Fuel Dispositions
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Log call outcomes, record transporter statuses, and manage fuel follow-ups.
            </p>
            
            <div className="mt-8 flex items-center text-[#F59E0B] font-semibold text-sm gap-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Launch module
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          {/* Placeholder Module 2 */}
          <div className="bg-muted/30 border border-border rounded-xl p-8 opacity-70 pointer-events-none pb-12 relative overflow-hidden transition-all duration-300 shadow-sm">
            <div className="h-14 w-14 rounded-xl bg-secondary border border-border/50 flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h2 className="font-['Syne',sans-serif] font-bold text-2xl text-muted-foreground mb-3">
              Telematics
            </h2>
            <p className="text-[15px] text-muted-foreground/80">
              Real-time GPS tracking and vehicle status monitoring.
            </p>
            <div className="absolute right-0 bottom-0 p-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded bg-secondary text-[10px] font-['JetBrains_Mono',monospace] font-medium text-muted-foreground uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          </div>
          
          {/* Placeholder Module 3 */}
          <div className="bg-muted/30 border border-border rounded-xl p-8 opacity-70 pointer-events-none pb-12 relative overflow-hidden transition-all duration-300 shadow-sm">
            <div className="h-14 w-14 rounded-xl bg-secondary border border-border/50 flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h2 className="font-['Syne',sans-serif] font-bold text-2xl text-muted-foreground mb-3">
              Analytics
            </h2>
            <p className="text-[15px] text-muted-foreground/80">
              View conversion rates, disposition statistics, and OMC targets.
            </p>
            <div className="absolute right-0 bottom-0 p-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded bg-secondary text-[10px] font-['JetBrains_Mono',monospace] font-medium text-muted-foreground uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
