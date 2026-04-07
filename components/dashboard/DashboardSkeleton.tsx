'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-32 hidden sm:block" />
          <Skeleton className="h-9 w-24 hidden sm:block" />
        </div>
      </div>

      {/* Identity Switcher Skeleton */}
      <Card className="border-border bg-card/50 shadow-none overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Personal Banner Skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 h-48 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-12 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[350px]">
          <CardContent className="p-6 h-full flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="flex-1 w-full" />
          </CardContent>
        </Card>
        <Card className="h-[350px]">
          <CardContent className="p-6 h-full flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="flex-1 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Team Overview Separator */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border/50" />
        <Skeleton className="h-3 w-32" />
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Bottom KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
