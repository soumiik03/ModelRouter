import { NextResponse } from 'next/server';
import { fetchCacheStatsData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchCacheStatsData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch cache stats' }, { status: 500 });
  }
}
