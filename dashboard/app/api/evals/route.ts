import { NextResponse } from 'next/server';
import { fetchEvalsData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchEvalsData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch benchmark evaluations' }, { status: 500 });
  }
}
