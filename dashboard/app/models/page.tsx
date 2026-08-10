'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import ModelsView from '@/components/views/ModelsView';
import type { AnalyticsSummary } from '@/lib/data';

export default function ModelsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load model performance:', e);
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
        <ModelsView data={data} loading={loading} />
      </main>
    </div>
  );
}
