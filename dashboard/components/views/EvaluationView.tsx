'use client';

import React from 'react';
import type { EvalsData } from '@/lib/data';
import { formatCurrency, formatLatency } from '@/lib/utils';
import { BarChart3, Sparkles, CheckCircle2, AlertTriangle, Cpu, Layers } from 'lucide-react';

interface EvaluationViewProps {
  evalsData: EvalsData | null;
  loading: boolean;
}

export default function EvaluationView({ evalsData, loading }: EvaluationViewProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <span className="inline-block animate-spin mr-2">⚡</span> Loading 60-task benchmark evaluation results...
      </div>
    );
  }

  if (!evalsData || !evalsData.summary || evalsData.summary.length === 0) {
    return <div className="p-8 text-center text-rose-300 font-mono text-sm">Benchmark data unavailable. Unable to load evaluation results.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#161824] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
            Final Benchmark Report
          </span>
          <span className="text-xs text-gray-500 font-mono">60 Tasks × 4 Strategies = 240 Evaluations</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          60-Task Benchmark Evaluation Matrix
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl">
          Comprehensive quality, latency, failure, and cost evaluation across 60 prompt tasks executed across Always Cheap, Always Expensive, Heuristic Router, and Learned Bandit strategies.
        </p>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {evalsData.summary.map((s) => {
          const isBandit = s.strategy === 'learned-bandit';
          const isHeuristic = s.strategy === 'heuristic-router';

          return (
            <div
              key={s.strategy}
              className={`p-5 rounded-xl border ${
                isBandit
                  ? 'bg-[#0f111c] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-[#0b0c10] border-[#181a27]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white font-mono uppercase">
                  {s.strategy.replace(/-/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#161826] text-gray-300 border border-[#222538] text-[10px] font-mono">
                  60 Runs
                </span>
              </div>

              <div className="space-y-3 font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">Quality Score</span>
                  <span className="text-2xl font-extrabold text-violet-400">
                    {s.avgQualityScore} <span className="text-xs text-gray-500 font-normal">/ 1.00</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#181a27]">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Avg Latency</span>
                    <span className={`text-base font-bold ${isBandit ? 'text-emerald-400' : 'text-cyan-400'}`}>
                      {formatLatency(s.avgLatencyMs)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Failures</span>
                    <span className={`text-base font-bold ${s.failureCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.failureCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#181a27] text-xs text-gray-400 flex justify-between">
                  <span className="text-gray-500">Total Cost:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(s.totalCost)}</span>
                </div>

                {/* Model Breakdown for Heuristic and Learned Routing */}
                {(isHeuristic || isBandit) && s.modelBreakdown && (
                  <div className="pt-2 border-t border-[#181a27] space-y-1">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Model Distribution</span>
                    {Object.entries(s.modelBreakdown).map(([model, count]) => (
                      <div key={model} className="flex items-center justify-between text-[10px] text-gray-300">
                        <span className="truncate max-w-[140px]">{model.split('/').pop()}</span>
                        <span className="text-violet-400 font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Requirement 7: Full Evaluation Table */}
      <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            240 Benchmark Task Evaluation Results Table
          </h2>
          <span className="text-xs text-gray-400 font-mono">Source: ModelRouter evaluation pipeline</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
              <tr>
                <th className="py-3 px-4 font-semibold">Strategy</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Quality</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Latency</th>
                <th className="py-3 px-4 font-semibold text-right">Failures</th>
                <th className="py-3 px-4 font-semibold text-right">Total Cost</th>
                <th className="py-3 px-4 font-semibold">Most Used Model</th>
                <th className="py-3 px-4 font-semibold text-right">Heuristic Hit %</th>
                <th className="py-3 px-4 font-semibold text-right">LLM Fallback %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151724]">
              {evalsData.summary.map((s) => (
                <tr key={s.strategy} className="hover:bg-[#0f111b] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white uppercase">{s.strategy.replace(/-/g, ' ')}</td>
                  <td className="py-3.5 px-4 text-right text-violet-400 font-bold">{s.avgQualityScore}</td>
                  <td className="py-3.5 px-4 text-right text-cyan-400">{formatLatency(s.avgLatencyMs)}</td>
                  <td className="py-3.5 px-4 text-right">
                    {s.failureCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/50 font-bold">
                        {s.failureCount}
                      </span>
                    ) : (
                      <span className="text-emerald-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">{formatCurrency(s.totalCost)}</td>
                  <td className="py-3.5 px-4 text-gray-300">{s.mostFrequentModel}</td>
                  <td className="py-3.5 px-4 text-right text-gray-400">{s.heuristicHitRate === '—' ? 'Not applicable' : s.heuristicHitRate}</td>
                  <td className="py-3.5 px-4 text-right text-gray-400">{s.llmFallbackRate === '—' ? 'Not applicable' : s.llmFallbackRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
