'use client';

import React from 'react';
import type { CacheStatsData, AnalyticsSummary } from '@/lib/data';
import { Database, Zap, Layers, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface CacheViewProps {
  cacheStats: CacheStatsData | null;
  analyticsData: AnalyticsSummary | null;
  loading: boolean;
}

export default function CacheView({ cacheStats, analyticsData, loading }: CacheViewProps) {
  if (loading || !cacheStats) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <span className="inline-block animate-spin mr-2">⚡</span> Loading cache telemetry...
      </div>
    );
  }

  const cacheHitRate = analyticsData?.cacheHitRatePercent ?? 0;
  const totalRequests = analyticsData?.totalRequests ?? 0;
  const cacheHitsCount = Math.round((totalRequests * cacheHitRate) / 100);
  const cacheMissesCount = totalRequests - cacheHitsCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#161824] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
            Caching Infrastructure
          </span>
          <span className="text-xs text-gray-500 font-mono">Infrastructure Hub</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Exact Match & Semantic Cache Monitoring
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl">
          Two-layer cache using exact prompt matching and semantic similarity.
        </p>
      </div>

      {/* Requirement 5: Real Cache Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exact Cache Status */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Exact Match Cache</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-extrabold text-white font-mono">
            {cacheStats.exactCache.provider}
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Status: {cacheStats.exactCache.status} (TTL: {cacheStats.exactCache.ttlSeconds}s)</span>
          </div>
        </div>

        {/* Semantic Cache Status */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Semantic Cache</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-extrabold text-white font-mono">
            {cacheStats.semanticCache.totalEntries} <span className="text-xs text-gray-500 font-normal">entries</span>
          </div>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            Model: {cacheStats.semanticCache.model} (&gt;= {cacheStats.semanticCache.similarityThreshold * 100}%)
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cache Hit Rate</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {cacheHitRate}%
          </div>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            {cacheHitsCount} hits / {cacheMissesCount} misses
          </div>
        </div>

        {/* Requests Avoided */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Reqs Avoided</span>
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-violet-400 font-mono">
            {cacheHitsCount}
          </div>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            LLM API calls bypassed completely
          </div>
        </div>
      </div>

      {/* Layered Cache Architecture Info */}
      <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-400" />
          Configured Caching Stack Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-[#0e1018] border border-[#1c1e2e] space-y-2">
            <div className="text-amber-400 font-bold">Exact Match</div>
            <p className="text-gray-400 leading-relaxed font-sans">
              SHA-256 prompt key
            </p>
            <div className="text-gray-500 pt-1 border-t border-[#181a27]">
              Provider: {cacheStats.exactCache.provider}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0e1018] border border-[#1c1e2e] space-y-2">
            <div className="text-cyan-400 font-bold">Semantic Cache</div>
            <p className="text-gray-400 leading-relaxed font-sans whitespace-pre-line">
              384-dimensional embeddings<br/>
              Similarity threshold: {cacheStats.semanticCache.similarityThreshold}
            </p>
            <div className="text-gray-500 pt-1 border-t border-[#181a27]">
              Total Vectors Stored: {cacheStats.semanticCache.totalEntries}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
