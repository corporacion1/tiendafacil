import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Security from '@/models/Security';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        hasPin: false,
        isLocked: false,
        remainingAttempts: 5
      });
    }
    
    const securityRecord = await Security.findOne({ userId: session.user.id });
    
    if (!securityRecord) {
      return NextResponse.json({
        hasPin: false,
        isLocked: false,
        remainingAttempts: 5
      });
    }
    
    const isLocked = securityRecord.lockedUntil && new Date() < securityRecord.lockedUntil;
    const maxAttempts = 5;
    const remainingAttempts = Math.max(0, maxAttempts - securityRecord.attempts);
    
    return NextResponse.json({
      hasPin: true,
      isLocked: !!isLocked,
      remainingAttempts: isLocked ? 0 : remainingAttempts
    });

  } catch (error) {
    console.error('Error en security status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}