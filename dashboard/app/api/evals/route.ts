import { NextResponse } from 'next/server';
import { fetchEvalComparisonData } from '@/lib/data';

export async function GET() {
  try {
    const data = await fetchEvalComparisonData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch evals comparison' }, { status: 500 });
  }
}
