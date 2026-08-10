'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import BudgetsView from '@/components/views/BudgetsView';
import type { BudgetsData } from '@/lib/data';

export default function BudgetsPage() {
  const [budgetsData, setBudgetsData] = useState<BudgetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        setBudgetsData(await res.json());
      }
    } catch (e) {
      console.error('Failed to load budget data:', e);
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
        <BudgetsView budgetsData={budgetsData} loading={loading} />
      </main>
    </div>
  );
}
