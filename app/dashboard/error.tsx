'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('📊 DASHBOARD ROUTE ERROR:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-in fade-in duration-500">
      <div className="size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h2 className="text-xl font-black font-heading text-foreground mb-2 uppercase tracking-tight">
        Performance Engine Synchronization Error
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 font-medium">
        We encountered a mismatch while reconciling your performance metrics. Please try re-initializing the dashboard stream.
      </p>
      <Button 
        variant="secondary" 
        size="lg" 
        className="font-black gap-2 uppercase tracking-wide px-8 border border-border"
        onClick={() => reset()}
      >
        <RotateCcw className="size-4" /> Reset Module
      </Button>
    </div>
  );
}
