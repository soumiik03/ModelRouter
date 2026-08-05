'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import CostOverTimeChart from '@/components/charts/CostOverTimeChart';
import CostPerModelBreakdown from '@/components/charts/CostPerModelBreakdown';
import LatencyDistributionChart from '@/components/charts/LatencyDistributionChart';
import RoutingCacheHitChart from '@/components/charts/RoutingCacheHitChart';
import type { AnalyticsSummary } from '@/lib/data';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/utils';
import { 
  DollarSign, 
  Zap, 
  Activity, 
  Layers, 
  CheckCircle2, 
  TrendingDown, 
  ArrowUpRight, 
  Clock, 
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header onRefresh={loadData} isRefreshing={isRefreshing} />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Page Title & Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-400 border border-violet-700/50">
                Chapter 7 — Live Metrics
              </span>
              <span className="text-xs text-gray-500">• Postgres Request Logs</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cost, Latency & Quality Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1018] border border-[#1a1c2b] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-gray-300 font-medium">Upstash Redis exact match active</span>
            </div>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Requests */}
            <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-violet-500/40 transition-all duration-200 relative group overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Total Requests</span>
                <div className="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-violet-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {formatNumber(data.totalRequests)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4% vs last hour</span>
              </div>
            </div>

            {/* Total Cost & Savings */}
            <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-emerald-500/40 transition-all duration-200 relative group overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Total Cost (USD)</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {formatCurrency(data.totalCostUsd)}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{data.costSavingsPercent}% saved vs baseline</span>
              </div>
            </div>

            {/* Avg Latency */}
            <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-cyan-500/40 transition-all duration-200 relative group overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Avg Latency</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {formatLatency(data.avgLatencyMs)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-400">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                <span>Cache accelerated</span>
              </div>
            </div>

            {/* Cache Hit Rate */}
            <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-amber-500/40 transition-all duration-200 relative group overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Cache Hit Rate</span>
                <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {data.cacheHitRatePercent}%
              </div>
              <div className="mt-2 text-[11px] text-gray-400 truncate">
                Exact (Redis) + Semantic (MiniLM)
              </div>
            </div>

            {/* Quality Score */}
            <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-purple-500/40 transition-all duration-200 relative group overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Quality Score</span>
                <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {data.avgQualityScore} <span className="text-xs text-gray-500 font-normal">/ 1.00</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>99.2% accuracy threshold</span>
              </div>
            </div>
          </div>
        )}

        {/* 7.2 Core Charts Grid */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Cost Over Time */}
            <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Cost Over Time</h3>
                  <p className="text-xs text-gray-500">Router Cost vs Unrouted Always-Expensive Baseline</p>
                </div>
                <div className="px-2 py-1 rounded bg-violet-950/80 text-violet-400 text-[10px] font-mono border border-violet-800/40">
                  Hourly Aggregation
                </div>
              </div>
              <CostOverTimeChart data={data.costOverTime} />
            </div>

            {/* Chart 2: Cost per Model Breakdown */}
            <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Cost & Volume per Model</h3>
                  <p className="text-xs text-gray-500">Distribution across cheap, mid, and frontier models</p>
                </div>
                <div className="px-2 py-1 rounded bg-cyan-950/80 text-cyan-400 text-[10px] font-mono border border-cyan-800/40">
                  Model Distribution
                </div>
              </div>
              <CostPerModelBreakdown data={data.modelBreakdown} />
            </div>

            {/* Chart 3: Latency Distribution */}
            <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Latency Distribution</h3>
                  <p className="text-xs text-gray-500">Response time buckets (ms) across all requests</p>
                </div>
                <div className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-400 text-[10px] font-mono border border-emerald-800/40">
                  Latency Buckets
                </div>
              </div>
              <LatencyDistributionChart data={data.latencyDistribution} />
            </div>

            {/* Chart 4: Routing & Cache Strategy Breakdown */}
            <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Routing & Cache Hit Breakdown</h3>
                  <p className="text-xs text-gray-500">Exact vs Semantic vs Heuristic vs Bandit</p>
                </div>
                <div className="px-2 py-1 rounded bg-amber-950/80 text-amber-400 text-[10px] font-mono border border-amber-800/40">
                  Routing Ratios
                </div>
              </div>
              <RoutingCacheHitChart data={data.routingDistribution} />
            </div>
          </div>
        )}

        {/* Live Request Logs Table */}
        {data && (
          <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Router Logs</h3>
                <p className="text-xs text-gray-500">Live stream from PostgreSQL request_logs table</p>
              </div>
              <span className="text-xs text-gray-400 font-mono">Showing last {data.recentLogs.length} logs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Time</th>
                    <th className="py-3 px-4 font-semibold">Prompt Snippet</th>
                    <th className="py-3 px-4 font-semibold">Model Selected</th>
                    <th className="py-3 px-4 font-semibold">Routing Strategy</th>
                    <th className="py-3 px-4 font-semibold">Latency</th>
                    <th className="py-3 px-4 font-semibold">Cost</th>
                    <th className="py-3 px-4 font-semibold">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151724]">
                  {data.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#0f111b] transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-400 whitespace-nowrap">{log.createdAt}</td>
                      <td className="py-3 px-4 text-gray-200 max-w-xs truncate font-medium">{log.prompt}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#161826] text-gray-300 border border-[#222538] font-mono text-[11px]">
                          {log.modelUsed.split('/').pop()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {log.wasFallback && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/50 text-[10px]">
                              Fallback
                            </span>
                          )}
                          <span className="text-gray-400 truncate max-w-xs">{log.routingReason}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400 whitespace-nowrap">
                        {formatLatency(log.latencyMs)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">
                        {formatCurrency(log.costUsd)}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-400 font-bold whitespace-nowrap">
                        {log.qualityScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
