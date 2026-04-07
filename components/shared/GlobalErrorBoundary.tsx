'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * PRODUCTION-READY ERROR BOUNDARY
 * Catches client-side crashes and provides a graceful recovery UI.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ CRITICAL FRONTEND ERROR:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
          <div className="size-20 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 shadow-pill animate-pulse">
             <AlertTriangle className="size-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-black font-heading text-foreground tracking-tight mb-2 uppercase">
             Registry Integrity Failure
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed font-medium">
             An unexpected exception occurred in the dashboard engine. We have logged the incident for immediate review.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
             <Button 
                variant="default" 
                size="lg" 
                className="font-black gap-2 uppercase tracking-widest px-8"
                onClick={() => window.location.reload()}
             >
                <RefreshCw className="size-4" /> Hard Refresh
             </Button>
             <Button 
                variant="outline" 
                size="lg" 
                className="font-black gap-2 uppercase tracking-widest px-8"
                onClick={() => window.location.href = '/'}
             >
                <Home className="size-4" /> Return to Bridge
             </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
