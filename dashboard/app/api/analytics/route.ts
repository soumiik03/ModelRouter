import { NextResponse } from 'next/server';
import { fetchAnalyticsData } from '@/lib/data';

export async function GET() {
  try {
    const data = await fetchAnalyticsData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
