'use client';

import React from 'react';
import type { AnalyticsSummary } from '@/lib/data';
import { formatCurrency, formatLatency } from '@/lib/utils';
import { Cpu } from 'lucide-react';

interface ModelsViewProps {
  data: AnalyticsSummary | null;
  loading: boolean;
}

export default function ModelsView({ data, loading }: ModelsViewProps) {
  if (loading || !data) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <span className="inline-block animate-spin mr-2">⚡</span> Loading model performance metrics...
      </div>
    );
  }

  const actualModels = data.modelPerformance.filter(m => m.model !== 'unresolved_failures');
  const unresolvedFailures = data.modelPerformance.find(m => m.model === 'unresolved_failures');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#161824] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
            LLM Provider Telemetry
          </span>
          <span className="text-xs text-gray-500 font-mono">Recorded Models Performance</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Model Performance & Reliability
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl">
          Detailed metrics aggregated across all OpenRouter providers including request volume, average latency, failure counts, and total cost recorded in live request logs.
        </p>
      </div>

      {/* Requirement 5: Model Performance Table */}
      <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              Runtime Request Logs Model Matrix
            </h2>
            <p className="text-xs text-gray-500">Runtime requests are not automatically benchmark-scored.</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{actualModels.length} Active Provider Models</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
              <tr>
                <th className="py-3 px-4 font-semibold">Model</th>
                <th className="py-3 px-4 font-semibold text-right">Requests</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Latency</th>
                <th className="py-3 px-4 font-semibold text-right">Runtime Quality</th>
                <th className="py-3 px-4 font-semibold text-right">Failures</th>
                <th className="py-3 px-4 font-semibold text-right">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151724]">
              {actualModels.map((m) => (
                <tr key={m.model} className="hover:bg-[#0f111b] transition-colors">
                  <td className="py-3 px-4 text-white font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <div className="flex flex-col">
                      <span className="text-gray-200">{m.displayName}</span>
                      <span className="text-[10px] text-gray-500 font-normal">{m.model}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-200 font-bold">{m.requests}</td>
                  <td className="py-3 px-4 text-right text-cyan-400">{formatLatency(m.avgLatencyMs)}</td>
                  <td className="py-3 px-4 text-right text-purple-400 font-bold">
                    {m.qualityScore != null ? m.qualityScore : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.failures > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/50 font-bold">
                        {m.failures}
                      </span>
                    ) : (
                      <span className="text-emerald-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatCurrency(m.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {unresolvedFailures && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 flex items-center gap-4 max-w-sm">
          <div className="p-2 bg-rose-900/40 rounded-lg">
            <Cpu className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-rose-200">Unresolved Routing Failures</div>
            <div className="text-2xl font-bold text-rose-400 font-mono">{unresolvedFailures.requests}</div>
            <div className="text-[10px] text-rose-300/70">Requests failed before model selection</div>
          </div>
        </div>
      )}
    </div>
  );
}
