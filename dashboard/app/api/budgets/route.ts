import { NextResponse } from 'next/server';
import { fetchBudgetsData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchBudgetsData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch budget metrics' }, { status: 500 });
  }
}
