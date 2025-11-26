import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const cashSessions = await db.collection('cashsessions')
      .find({ storeId })
      .toArray();

    return NextResponse.json(cashSessions);
  } catch (error) {
    console.error('Error fetching cash sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch cash sessions' }, { status: 500 });
  }
}