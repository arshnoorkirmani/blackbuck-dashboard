'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, List, Star, Calendar, 
  ArrowUpRight, Target, BarChart3 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import { AgentSalesTable } from './AgentSalesTable';
import type { SalesRow } from '@/lib/types/dashboard';
import { prepareThresholdChartData } from '@/lib/utils/normalization';

interface PerformanceCardProps {
  title: string;
  threshold: number;
  sales: SalesRow[];
  color?: string;
}

export function PerformanceCard({ title, threshold, sales, color = "#3B82F6" }: PerformanceCardProps) {
  const filteredSales = useMemo(() => {
    return sales.filter(s => s.planCost >= threshold);
  }, [sales, threshold]);

  const chartData = useMemo(() => {
    return prepareThresholdChartData(sales, threshold);
  }, [sales, threshold]);

  const totalVolume = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.planCost, 0);
  }, [filteredSales]);

  return (
    <Card className="border-border shadow-md overflow-hidden bg-card/50">
      <CardHeader className="p-4 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
             <Star className="size-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-black tracking-tight uppercase">{title}</CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
               Threshold: ₹{threshold.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] uppercase font-black text-muted-foreground leading-none mb-1">Volume</p>
           <p className="text-sm font-black text-foreground">₹{Math.round(totalVolume).toLocaleString('en-IN')}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="chart" className="w-full">
          <div className="px-4 pt-3 flex items-center justify-between">
             <TabsList className="bg-muted/50 h-8 p-1">
                <TabsTrigger value="chart" className="text-[10px] px-3 font-bold uppercase transition-all">
                   <TrendingUp className="size-3 mr-1.5" /> Trend
                </TabsTrigger>
                <TabsTrigger value="list" className="text-[10px] px-3 font-bold uppercase transition-all">
                   <List className="size-3 mr-1.5" /> All Records
                </TabsTrigger>
             </TabsList>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground">Total:</span>
                <span className="text-xs font-black text-primary">{filteredSales.length} Units</span>
             </div>
          </div>

          <TabsContent value="chart" className="p-4 mt-0">
            <div className="h-[200px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`grad-${threshold}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 600 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 600 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <RechartsTooltip 
                       content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                                <div className="bg-background/95 backdrop-blur-sm border border-border p-2 rounded-lg shadow-xl text-[10px] font-bold border-primary/20">
                                   <p className="border-b border-border/50 pb-1 mb-1">{payload[0].payload.date}</p>
                                   <p className="flex items-center gap-1.5">
                                      <span className="size-1.5 rounded-full bg-primary" />
                                      {title}: <span className="text-foreground">{payload[0].value} Sales</span>
                                   </p>
                                </div>
                             )
                          }
                          return null;
                       }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={color} 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill={`url(#grad-${threshold})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-30">
                   <BarChart3 className="size-8 mb-2" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">No Trend Data Found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list" className="p-4 mt-0">
             <AgentSalesTable sales={filteredSales} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
