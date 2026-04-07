"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

interface ChartWithTableTabsProps {
  title: string;
  chartContent: React.ReactNode;
  tableData: any[];
  tableColumns: { key: string; label: string }[];
}

export function ChartWithTableTabs({ title, chartContent, tableData, tableColumns }: ChartWithTableTabsProps) {
  const [activeTab, setActiveTab] = useState("chart");

  return (
    <div className="overflow-hidden relative flex flex-col h-full w-full">
      <div className="pb-4 flex flex-row items-center justify-between space-y-0">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[140px]">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="chart" className="text-[10px] uppercase font-bold tracking-wider">Chart</TabsTrigger>
            <TabsTrigger value="table" className="text-[10px] uppercase font-bold tracking-wider">Data</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 min-h-[300px]">
        {activeTab === "chart" && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {chartContent}
          </motion.div>
        )}
        {activeTab === "table" && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-h-[300px] overflow-y-auto custom-scrollbar border rounded-md"
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  {tableColumns.map(col => (
                    <TableHead key={col.key} className="text-xs font-semibold">{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="text-center py-6 text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                      {tableColumns.map(col => (
                        <TableCell key={col.key} className="text-xs">{row[col.key]}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
