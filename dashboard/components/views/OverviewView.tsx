'use client';

import React from 'react';
import type { AnalyticsSummary } from '@/lib/data';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/utils';
import { 
  Activity, 
  Clock, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  GitFork,
  Cpu,
  BarChart3
} from 'lucide-react';

interface OverviewViewProps {
  data: AnalyticsSummary | null;
  loading: boolean;
}

export default function OverviewView({ data, loading }: OverviewViewProps) {
  if (loading || !data) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <span className="inline-block animate-spin mr-2">⚡</span> Loading real observability metrics from Router API...
      </div>
    );
  }

  // Find Learned Bandit benchmark quality from summary.json if attached
  const banditSummary = data.benchmarkSummary?.find((s) => s.strategy === 'learned-bandit');
  const benchmarkQualityStr = banditSummary?.avgQualityScore ?? 'N/A';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#161824] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
              Runtime Telemetry
            </span>
            <span className="text-xs text-gray-500 font-mono">Recorded Routing Activity</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Overview & Runtime Metrics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1018] border border-[#1a1c2b] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-300 font-medium font-mono">Active Strategy: {data.currentStrategy}</span>
          </div>
        </div>
      </div>

      {/* Aggregate Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Requests & Success */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-orange-500/50 transition-all group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Requests</span>
            <Activity className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {formatNumber(data.totalRequests)}
          </div>
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatNumber(data.successfulRequests)} successful</span>
          </div>
        </div>

        {/* Failure Rate */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-orange-500/50 transition-all group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Failure Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {data.failureRatePercent}%
          </div>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            {data.failureRatePercent === 0 ? 'Zero recorded failures' : `${data.totalRequests - data.successfulRequests} failed requests`}
          </div>
        </div>

        {/* Requirement 3 Fix: Wording "Across 100 routed requests" */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-orange-500/50 transition-all group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {formatLatency(data.avgLatencyMs)}
          </div>
          <div className="mt-2 text-xs text-cyan-400 font-mono">
            Across {data.totalRequests} routed requests
          </div>
        </div>

        {/* Requirement 4 Fix: Live Quality Score explicitly labeled as N/A */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-orange-500/50 transition-all group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quality Scoring</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {data.avgQualityScore != null ? data.avgQualityScore : 'N/A'}
          </div>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            Not available for runtime traffic
          </div>
        </div>

        {/* Clearly labeled Benchmark Quality card sourced from summary.json */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] hover:border-orange-500/50 transition-all group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">Benchmark Quality</span>
            <BarChart3 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-violet-300 font-mono">
            {benchmarkQualityStr} <span className="text-xs text-gray-500 font-normal">/ 1.00</span>
          </div>
          <div className="mt-2 text-xs text-violet-400 font-mono">
            Evaluation benchmark
          </div>
        </div>
      </div>

      {/* Model Distribution Overview */}
      <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              Active Models & Request Breakdown
            </h2>
            <p className="text-xs text-gray-500">Distribution of routed requests per LLM provider/model</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.modelPerformance.map((m) => (
            <div key={m.model} className="p-4 rounded-lg bg-[#0e1018] border border-[#1c1e2e] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono truncate max-w-[150px]">{m.displayName}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
              </div>
              <div className="text-lg font-extrabold text-gray-200 font-mono">
                {m.requests} <span className="text-xs text-gray-500 font-normal">reqs</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1 border-t border-[#181a27]">
                <span>Avg: {formatLatency(m.avgLatencyMs)}</span>
                <span>Quality: {m.qualityScore != null ? m.qualityScore : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Routing Activity Stream */}
      <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <GitFork className="w-4 h-4 text-violet-400" />
              Recorded Routing Activity
            </h2>
            <p className="text-xs text-gray-500">Routing events from runtime or evaluation traffic</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">Showing last {data.recentLogs.length} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Task Prompt</th>
                <th className="py-2.5 px-3 font-semibold">Selected Model</th>
                <th className="py-2.5 px-3 font-semibold">Strategy / Reason</th>
                <th className="py-2.5 px-3 font-semibold">Latency</th>
                <th className="py-2.5 px-3 font-semibold">Cost</th>
                <th className="py-2.5 px-3 font-semibold">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151724]">
              {data.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0f111b] transition-colors">
                  <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 text-gray-200 max-w-xs truncate font-medium">{log.prompt}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#161826] text-gray-300 border border-[#222538] text-[11px]">
                      {log.modelUsed.split('/').pop()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 truncate max-w-xs">{log.routingReason}</td>
                  <td className="py-2.5 px-3 text-cyan-400 whitespace-nowrap">{formatLatency(log.latencyMs)}</td>
                  <td className="py-2.5 px-3 text-emerald-400 whitespace-nowrap">{formatCurrency(log.costUsd)}</td>
                  <td className="py-2.5 px-3 text-purple-400 font-bold whitespace-nowrap">
                    {log.qualityScore != null ? log.qualityScore : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
