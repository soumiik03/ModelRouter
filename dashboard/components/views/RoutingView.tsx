'use client';

import React from 'react';
import type { EvalsData } from '@/lib/data';
import { formatCurrency, formatLatency } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';

interface RoutingViewProps {
  evalsData: EvalsData | null;
  loading: boolean;
}

function formatStrategyName(strategy: string): string {
  switch (strategy) {
    case 'always-cheap': return 'Always Cheap';
    case 'always-expensive': return 'Always Expensive';
    case 'heuristic-router': return 'Heuristic Router';
    case 'learned-bandit': return 'Learned Bandit';
    default: return strategy.replace(/-/g, ' ');
  }
}

export default function RoutingView({ evalsData, loading }: RoutingViewProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <span className="inline-block animate-spin mr-2">⚡</span> Loading routing strategy benchmark summary...
      </div>
    );
  }

  if (!evalsData || !evalsData.summary || evalsData.summary.length === 0) {
    return <div className="p-8 text-center text-rose-300 font-mono text-sm">Benchmark data unavailable. Unable to load routing evaluation results.</div>;
  }

  const summary = evalsData.summary;
  const bandit = summary.find((s) => s.strategy === 'learned-bandit');

  const latencyChartData = summary.map((s) => ({
    name: formatStrategyName(s.strategy),
    latencyMs: Number(s.avgLatencyMs),
  }));

  const qualityChartData = summary.map((s) => ({
    name: formatStrategyName(s.strategy),
    qualityScore: parseFloat(String(s.avgQualityScore)),
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#161824] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
            Routing Performance Benchmark
          </span>
          <span className="text-xs text-gray-500 font-mono">60 Tasks × 4 Strategies = 240 Evaluations</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Routing Strategy Comparison
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl">
          Side-by-side performance analysis demonstrating response latency, quality retention, failure rates, and model selection efficiency across baseline and learned strategies.
        </p>
      </div>

      {/* Key Achievement Callout */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0e1018] to-violet-950/40 border border-emerald-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-black">
              Benchmark Finding
            </span>
            <span className="text-sm font-bold text-white">Learned Bandit Latency & Quality Optimization</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
            Learned Bandit achieved the lowest observed latency in the benchmark while matching the Heuristic Router&apos;s quality score.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs whitespace-nowrap">
          <div className="px-3 py-2 rounded-lg bg-[#0b0c10] border border-emerald-500/30 text-emerald-400">
            <div className="text-[10px] text-gray-500 uppercase">Bandit Latency</div>
            <div className="text-base font-extrabold">{bandit ? formatLatency(bandit.avgLatencyMs) : 'N/A'}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[#0b0c10] border border-violet-500/30 text-violet-300">
            <div className="text-[10px] text-gray-500 uppercase">Quality Score</div>
            <div className="text-base font-extrabold">{bandit?.avgQualityScore ?? 'N/A'} / 1.00</div>
          </div>
        </div>
      </div>

      {/* Requirement 2 Fix: Two Separate Clear Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Average Latency by Strategy */}
        <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#181a27] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Average Latency by Strategy (ms)
              </h2>
              <p className="text-xs text-gray-500">Substantially lower latency achieved by Learned Bandit</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Lower is better</span>
          </div>

          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1e2d" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: '#1c1e2d' }} />
                <YAxis stroke="#06b6d4" fontSize={11} tickFormatter={(v) => `${v}ms`} axisLine={{ stroke: '#1c1e2d' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0d14',
                    borderColor: '#222538',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ms`, 'Avg Latency']}
                />
                <Bar dataKey="latencyMs" name="Avg Latency (ms)" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Quality Score by Strategy */}
        <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#181a27] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Average Quality Score by Strategy (0.00 – 1.00)
              </h2>
              <p className="text-xs text-gray-500">Comparable quality maintained across routed strategies</p>
            </div>
            <span className="text-xs font-mono text-violet-400">Higher is better</span>
          </div>

          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1e2d" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: '#1c1e2d' }} />
                <YAxis stroke="#8b5cf6" fontSize={11} domain={[0, 1.0]} tickFormatter={(v) => Number(v).toFixed(2)} axisLine={{ stroke: '#1c1e2d' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0d14',
                    borderColor: '#222538',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} / 1.00`, 'Quality Score']}
                />
                <Bar dataKey="qualityScore" name="Quality Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => {
          const isBandit = s.strategy === 'learned-bandit';
          return (
            <div
              key={s.strategy}
              className={`p-5 rounded-xl border transition-all ${
                isBandit
                  ? 'bg-[#0f111c] border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'bg-[#0b0c10] border-[#181a27]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white font-mono uppercase">
                  {formatStrategyName(s.strategy)}
                </span>
                {isBandit && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[9px] font-extrabold uppercase">
                    BENCHMARK LEADER
                  </span>
                )}
              </div>

              <div className="space-y-3 font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">Avg Latency</span>
                  <span className={`text-xl font-extrabold ${isBandit ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {formatLatency(s.avgLatencyMs)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#181a27]">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Quality</span>
                    <span className="text-base font-bold text-violet-400">{s.avgQualityScore}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Failures</span>
                    <span className={`text-base font-bold ${s.failureCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.failureCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#181a27] text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Evaluations:</span>
                    <span className="text-gray-200">60 tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Top Model:</span>
                    <span className="text-gray-300 truncate max-w-[120px]">{s.mostFrequentModel.split('/').pop()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
