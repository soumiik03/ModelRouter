'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import type { RequestLogItem } from '@/lib/data';
import { formatCurrency, formatLatency } from '@/lib/utils';

export default function RequestsPage() {
  const [logs, setLogs] = useState<RequestLogItem[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setLogs(data.recentLogs || []))
      .catch((e) => console.error('Failed to fetch request logs:', e));
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'fallback') return l.wasFallback;
    if (filter === 'cache') return l.modelUsed.includes('cache');
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-400 border border-violet-700/50">
              Live Stream
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Request Audit Logs</h1>
          </div>

          <div className="flex items-center gap-2 bg-[#0e1018] p-1 rounded-lg border border-[#1a1c2b]">
            {['all', 'cache', 'fallback'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Prompt</th>
                  <th className="py-3 px-4 font-semibold">Model Selected</th>
                  <th className="py-3 px-4 font-semibold">Routing Reason</th>
                  <th className="py-3 px-4 font-semibold">Tokens (In/Out)</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Cost</th>
                  <th className="py-3 px-4 font-semibold">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151724]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0f111b] transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-500">#{log.id}</td>
                    <td className="py-3 px-4 font-mono text-gray-400 whitespace-nowrap">{log.createdAt}</td>
                    <td className="py-3 px-4 text-gray-200 max-w-sm truncate font-medium">{log.prompt}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#161826] text-gray-300 border border-[#222538] font-mono text-[11px]">
                        {log.modelUsed}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{log.routingReason}</td>
                    <td className="py-3 px-4 font-mono text-gray-400">{log.tokensIn} / {log.tokensOut}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{formatLatency(log.latencyMs)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{formatCurrency(log.costUsd)}</td>
                    <td className="py-3 px-4 font-mono text-purple-400 font-bold">{log.qualityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
