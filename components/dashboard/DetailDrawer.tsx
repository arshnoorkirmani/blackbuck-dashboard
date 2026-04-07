'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { 
  User, Phone, Calendar, Fuel, MapPin, 
  CreditCard, Info, TrendingUp, Star, 
  Target, Hash, Shield, Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface DetailDrawerProps {
  data: any | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'sale' | 'agent';
}

export function DetailDrawer({ data, isOpen, onClose, type }: DetailDrawerProps) {
  if (!data) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl bg-card border-l border-border shadow-2xl overflow-y-auto">
        <SheetHeader className="border-b border-border pb-6 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className={`size-12 rounded-2xl flex items-center justify-center ${type === 'sale' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
              {type === 'sale' ? <CreditCard className="size-6" /> : <User className="size-6" />}
            </div>
            <div>
              <SheetTitle className="text-xl font-black font-heading tracking-tight uppercase">
                {type === 'sale' ? 'Transaction Intelligence' : 'Agent Performance Profile'}
              </SheetTitle>
              <SheetDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {type === 'sale' ? `ID: ${data.phone || 'N/A'}` : `EMP: ${data.empId || 'N/A'}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8">
          {/* Primary Identity Section */}
          <Section title="Primary Identity">
            <div className="grid grid-cols-2 gap-4">
              {type === 'sale' ? (
                <>
                  <InfoItem icon={Phone} label="Contact" value={data.phone} mono />
                  <InfoItem icon={Calendar} label="Date" value={data.planDate ? format(new Date(data.planDate), 'dd MMM yyyy') : '—'} />
                  <InfoItem icon={User} label="Agent" value={data.agentEmail?.split('@')[0]} />
                  <InfoItem icon={Shield} label="TL Name" value={data.tlName} />
                </>
              ) : (
                <>
                  <InfoItem icon={Hash} label="Employee ID" value={data.empId} mono />
                  <InfoItem icon={Mail} label="Email" value={data.emailId} />
                  <InfoItem icon={Shield} label="TL Name" value={data.tlName} />
                  <InfoItem icon={MapPin} label="Location" value={data.location} />
                </>
              )}
            </div>
          </Section>

          {/* Performance/Value Section */}
          <Section title={type === 'sale' ? 'Financial Breakdown' : 'KPI Audit'}>
            <div className="grid grid-cols-2 gap-4">
              {type === 'sale' ? (
                <>
                  <InfoItem icon={Fuel} label="Plan Cost" value={`₹${Math.round(data.planCost).toLocaleString('en-IN')}`} highlight />
                  <InfoItem icon={TrendingUp} label="Points Earned" value={data.finalSalesPoints} highlight />
                  <InfoItem icon={Target} label="Achievement" value={`${data.achievementPercent?.toFixed(1)}%`} />
                  <InfoItem icon={MapPin} label="Zone" value={data.location} />
                </>
              ) : (
                <>
                  <InfoItem icon={Star} label="Total Sold" value={data.totalSold} highlight />
                  <InfoItem icon={TrendingUp} label="Sale Points" value={data.salePoints} highlight />
                  <InfoItem icon={Target} label="Achievement" value={`${data.percentAchieved?.toFixed(1)}%`} />
                  <InfoItem icon={Info} label="Grade" value={data.grade} />
                </>
              )}
            </div>
          </Section>

          {/* Metadata Section */}
          <Section title="System Metadata">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
               <div className="grid grid-cols-1 gap-2">
                  {Object.entries(data).map(([key, value]) => {
                    if (typeof value === 'object') return null;
                    return (
                      <div key={key} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                         <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">{key}</span>
                         <span className="text-[11px] font-bold text-foreground/80">{String(value)}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
        <div className="h-px flex-1 bg-primary/20" /> {title} <div className="h-px flex-1 bg-primary/20" />
      </h4>
      {children}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono, highlight }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
        <Icon className="size-3" /> {label}
      </p>
      <p className={`text-sm font-bold truncate ${mono ? 'font-mono tracking-tighter' : ''} ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value || '—'}
      </p>
    </div>
  );
}
