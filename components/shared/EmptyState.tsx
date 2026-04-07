'use client';

import React from 'react';
import { LucideIcon, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon = SearchX, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-500",
      className
    )}>
      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted/30 mb-4 border border-border/50">
        <Icon className="size-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-bold font-heading text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
