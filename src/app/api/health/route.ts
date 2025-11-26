import { NextResponse } from 'next/server';
import { healthCheck, getConnectionStatus } from '@/lib/mongodb';

export async function GET() {
  try {
    const health = await healthCheck();
    
    const response = {
      timestamp: new Date().toISOString(),
      status: health.status,
      database: health.details,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGO_URI
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      database: getConnectionStatus()
    }, { status: 500 });
  }
}