'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import StatusView from '@/components/views/StatusView';
import type { CacheStatsData } from '@/lib/data';

export default function SettingsPage() {
  const [cacheStats, setCacheStats] = useState<CacheStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/cache');
      if (res.ok) {
        setCacheStats(await res.json());
      }
    } catch (e) {
      console.error('Failed to load status settings:', e);
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
      <main className="p-8 max-w-7xl mx-auto w-full">
        <StatusView cacheStats={cacheStats} loading={loading} />
      </main>
    </div>
  );
}
