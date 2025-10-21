import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Security from '@/models/Security';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSession(request);
    
    console.log('📊 [Status API] GET recibido');
    console.log('👤 [Status API] Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('⚠️ [Status API] Sin sesión - retornando hasPin: false');
      return NextResponse.json({
        hasPin: false,
        isLocked: false,
        remainingAttempts: 5
      });
    }
    
    const securityRecord = await Security.findOne({ userId: session.user.id });
    console.log('🔍 [Status API] Registro encontrado:', !!securityRecord);
    
    if (!securityRecord) {
      console.log('⚠️ [Status API] No hay registro - retornando hasPin: false');
      return NextResponse.json({
        hasPin: false,
        isLocked: false,
        remainingAttempts: 5
      });
    }
    
    const isLocked = securityRecord.lockedUntil && new Date() < securityRecord.lockedUntil;
    const maxAttempts = 5;
    const remainingAttempts = Math.max(0, maxAttempts - securityRecord.attempts);
    
    console.log('✅ [Status API] Retornando hasPin: true, isLocked:', !!isLocked);
    
    return NextResponse.json({
      hasPin: true,
      isLocked: !!isLocked,
      remainingAttempts: isLocked ? 0 : remainingAttempts
    });

  } catch (error) {
    console.error('❌ [Status API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}