'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import { Sliders, Zap, Database, Key, Server, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header />

      <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-400 border border-violet-700/50">
            System Configuration
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Router Settings & Infrastructure</h1>
        </div>

        <div className="space-y-4">
          {/* Section 1: Upstash Redis */}
          <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Upstash Redis Exact-Match Cache</h3>
                <p className="text-xs text-gray-500">REST API based Redis cache configuration</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-[#0e1018] border border-[#1a1c2b]">
                <span className="text-gray-500 block font-mono">UPSTASH_REDIS_REST_URL</span>
                <span className="text-gray-200 font-mono">https://whole-fish-165115.upstash.io</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1018] border border-[#1a1c2b]">
                <span className="text-gray-500 block font-mono">UPSTASH_REDIS_REST_TOKEN</span>
                <span className="text-gray-200 font-mono">gQAAAAAAAoT7AAIgcDEzNjNk... (Configured)</span>
              </div>
            </div>
          </div>

          {/* Section 2: PostgreSQL Database */}
          <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">PostgreSQL & Drizzle ORM</h3>
                <p className="text-xs text-gray-500">Neon Postgres database connection pool</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1018] border border-[#1a1c2b] text-xs">
              <span className="text-gray-500 block font-mono">DATABASE_URL</span>
              <span className="text-gray-200 font-mono truncate block">postgresql://neondb_owner:***@ep-calm-shadow.aws.neon.tech/neondb</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
