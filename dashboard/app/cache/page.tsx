'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import CacheView from '@/components/views/CacheView';
import type { CacheStatsData, AnalyticsSummary } from '@/lib/data';

export default function CachePage() {
  const [cacheStats, setCacheStats] = useState<CacheStatsData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch('/api/cache'),
        fetch('/api/analytics'),
      ]);
      if (cRes.ok) setCacheStats(await cRes.json());
      if (aRes.ok) setAnalyticsData(await aRes.json());
    } catch (e) {
      console.error('Failed to load cache stats:', e);
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
        <CacheView cacheStats={cacheStats} analyticsData={analyticsData} loading={loading} />
      </main>
    </div>
  );
}
