'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import EvaluationView from '@/components/views/EvaluationView';
import type { EvalsData } from '@/lib/data';

export default function EvalsPage() {
  const [evalsData, setEvalsData] = useState<EvalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/evals', { signal: controller.signal });
      window.clearTimeout(timeout);
      if (!res.ok) throw new Error('Benchmark request failed');
      setEvalsData(await res.json());
      setError(false);
    } catch (e) {
      setError(true);
      setEvalsData(null);
      console.error('Failed to load benchmark evaluations:', e);
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
        <EvaluationView evalsData={evalsData} loading={loading} />
      </main>
    </div>
  );
}
