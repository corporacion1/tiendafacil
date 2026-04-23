import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function GET() {
  try {
    const start = Date.now();
    const { data, error } = await dbAdmin.from('products').select('count', { count: 'exact', head: true });
    const duration = Date.now() - start;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        type: 'db',
        latency: `${duration}ms`,
        connected: true
      },
      environment: process.env.NODE_ENV
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        type: 'db',
        connected: false
      }
    }, { status: 503 });
  }
}