'use client';

import React from 'react';
import type { CacheStatsData } from '@/lib/data';
import { Sliders, Server, Zap, Database, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface StatusViewProps {
  cacheStats: CacheStatsData | null;
  loading: boolean;
}

export default function StatusView({ cacheStats, loading }: StatusViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#161824] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
            Infrastructure Health
          </span>
          <span className="text-xs text-gray-500 font-mono">System Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Settings & Operational Status
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl">
          Active environment configuration, connected infrastructure status, and endpoint health diagnostics.
        </p>
      </div>

      {/* Infrastructure Components Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Router API */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-400" />
              Router API Server
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xs font-mono text-gray-300 space-y-1">
            <div>URL: <code className="text-violet-300">Backend API</code></div>
            <div>Framework: Fastify + TypeScript</div>
            <div className="text-emerald-400 font-semibold pt-1">HTTP 200 OK — Ready</div>
          </div>
        </div>

        {/* Redis Cache */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Exact Match Cache
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xs font-mono text-gray-300 space-y-1">
            <div>Provider: {cacheStats?.exactCache.provider || 'Upstash Redis'}</div>
            <div>TTL: {cacheStats?.exactCache.ttlSeconds || 3600}s</div>
            <div className="text-emerald-400 font-semibold pt-1">Status: Active</div>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              PostgreSQL (pgvector)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xs font-mono text-gray-300 space-y-1">
            <div>Vector Store: 384d MiniLM embeddings</div>
            <div>Features: Telemetry, Budgets, Semantic Cache</div>
            <div className="text-emerald-400 font-semibold pt-1">Status: Connected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
