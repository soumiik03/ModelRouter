'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import type { EvalStrategyItem } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
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
  Sparkles, 
  Award, 
  Video
} from 'lucide-react';

export default function EvalsPage() {
  const [strategies, setStrategies] = useState<EvalStrategyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvals = async () => {
    try {
      const res = await fetch('/api/evals');
      if (res.ok) {
        const json = await res.json();
        setStrategies(json);
      }
    } catch (e) {
      console.error('Failed to load evals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvals();
  }, []);

  const chartData = strategies.map(s => ({
    name: s.label.replace(' (Baseline)', '').replace(' (Chapter 3)', '').replace(' (Chapter 5)', '').replace(' (Chapter 6)', ''),
    fullName: s.label,
    qualityPercentage: Math.round(s.qualityScore * 100),
    costPer1k: s.costPer1k,
    savingsVsBaseline: s.savingsVsBaseline,
  }));

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header onRefresh={loadEvals} />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Thesis Header */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/60 via-[#0e1018] to-cyan-950/40 border border-violet-800/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Award className="w-48 h-48 text-violet-400" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-600 text-white shadow-lg glow-purple flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Thesis Demo View — Chapter 7.3
              </span>
              <span className="text-xs text-violet-300 font-medium">Chapter 4/5 Baseline Evaluation</span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Evaluation & Baseline Comparison Chart
            </h1>

            <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
              This chart encapsulates the core thesis of **ModelRouter**: intelligent heuristic classification, semantic caching, and dynamic multi-armed bandit routing maintain <span className="text-emerald-400 font-bold">95%+ of frontier model quality</span> while cutting operational LLM API costs by up to <span className="text-cyan-400 font-bold">91%</span>.
            </p>
          </div>
        </div>

        {/* Primary Thesis Chart: Cost vs Quality per Strategy */}
        <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#181a27] pb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Cost ($ / 1k Requests) vs Quality Score (%)
              </h2>
              <p className="text-xs text-gray-500">Visual proof of quality retention at fraction of cost</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-violet-500" />
                <span className="text-gray-300">Quality Score (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-gray-300">Cost ($ / 1k Reqs)</span>
              </div>
            </div>
          </div>

          <div className="w-full h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1e2d" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1c1e2d' }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#8b5cf6"
                  fontSize={11}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: '#1c1e2d' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={{ stroke: '#1c1e2d' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0d14',
                    borderColor: '#222538',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'qualityPercentage' ? `${val}%` : `$${val}`,
                    name === 'qualityPercentage' ? 'Quality Score' : 'Cost per 1k Reqs',
                  ]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="qualityPercentage"
                  name="Quality Score (%)"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
                <Bar
                  yAxisId="right"
                  dataKey="costPer1k"
                  name="Cost per 1k Reqs ($)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((st) => {
            const isRouter = st.strategy.includes('router') || st.strategy.includes('bandit');
            return (
              <div
                key={st.strategy}
                className={`p-6 rounded-xl border transition-all duration-200 relative ${
                  isRouter
                    ? 'bg-[#0f111c] border-violet-500/40 shadow-lg shadow-violet-950/20'
                    : 'bg-[#0b0c10] border-[#181a27]'
                }`}
              >
                {isRouter && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-700/50 text-[10px] font-bold">
                    ACTIVE ROUTER
                  </span>
                )}

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white pr-16">{st.label}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{st.description}</p>

                  <div className="pt-2 grid grid-cols-2 gap-3 border-t border-[#181a27]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Quality Score</span>
                      <span className="text-lg font-extrabold text-violet-400 font-mono">
                        {Math.round(st.qualityScore * 100)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Cost / 1k Reqs</span>
                      <span className="text-lg font-extrabold text-emerald-400 font-mono">
                        ${st.costPer1k.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 text-gray-400 font-mono border-t border-[#181a27]">
                    <span>Avg Latency: <strong className="text-cyan-400">{st.avgLatencyMs}ms</strong></span>
                    <span className="text-emerald-400 font-bold">{st.savingsVsBaseline}% Savings</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Evaluation Matrix Table */}
        <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Full Evaluation Matrix</h3>
              <p className="text-xs text-gray-500">Benchmark results extracted from Chapter 4 & 5 runs</p>
            </div>
            <span className="text-xs text-gray-400 font-mono">5 Baseline Strategies</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Strategy</th>
                  <th className="py-3 px-4 font-semibold">Cost / 1k Reqs</th>
                  <th className="py-3 px-4 font-semibold">Quality Score</th>
                  <th className="py-3 px-4 font-semibold">Avg Latency</th>
                  <th className="py-3 px-4 font-semibold">Heuristic Hit Rate</th>
                  <th className="py-3 px-4 font-semibold">Fallback Rate</th>
                  <th className="py-3 px-4 font-semibold">Primary Model</th>
                  <th className="py-3 px-4 font-semibold">Cost Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151724]">
                {strategies.map((s) => (
                  <tr key={s.strategy} className="hover:bg-[#0f111b] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{s.label}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">${s.costPer1k.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-violet-400 font-bold">{(s.qualityScore * 100).toFixed(0)}%</td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">{s.avgLatencyMs}ms</td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">{s.heuristicHitRate}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">{s.llmFallbackRate}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">{s.mostFrequentModel}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-bold text-[11px]">
                        {s.savingsVsBaseline}%
                      </span>
                    </td>
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
