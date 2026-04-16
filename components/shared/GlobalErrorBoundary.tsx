'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Critical frontend error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/10">
            <AlertTriangle className="size-10 text-destructive" />
          </div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            Something went wrong in the workspace
          </h1>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">
            An unexpected frontend error interrupted the current view. Refresh the workspace or return to the landing
            page to recover safely.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button variant="default" size="lg" className="gap-2 rounded-2xl px-8" onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" />
              Refresh workspace
            </Button>
            <Button variant="outline" size="lg" className="gap-2 rounded-2xl px-8" onClick={() => (window.location.href = '/')}>
              <Home className="size-4" />
              Return home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
