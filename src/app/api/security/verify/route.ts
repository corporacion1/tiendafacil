import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Security from '@/models/Security';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  console.log('🔐 [Verify API] Iniciando verificación de PIN...');
  
  await connectToDatabase();
  const session = await getSession(request);
  
  console.log('👤 [Verify API] Session:', session ? 'Found' : 'Not found');
  console.log('👤 [Verify API] User ID:', session?.user?.id);
  
  if (!session?.user?.id) {
    console.error('❌ [Verify API] No hay sesión válida');
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { pin } = await request.json();
  console.log('🔢 [Verify API] PIN recibido (length):', pin?.length);

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ 
      isValid: false, 
      error: "PIN debe tener 4 dígitos" 
    }, { status: 400 });
  }

  try {
    console.log('🔍 [Verify API] Buscando registro de seguridad para userId:', session.user.id);
    
    const securityRecord = await Security.findOne({ userId: session.user.id }).select('+pin');
    
    console.log('📋 [Verify API] Registro encontrado:', !!securityRecord);
    
    if (!securityRecord) {
      console.error('❌ [Verify API] No hay PIN configurado para este usuario');
      return NextResponse.json({ 
        isValid: false, 
        error: "No hay PIN configurado" 
      }, { status: 404 });
    }

    // Verificar si está bloqueado
    if (securityRecord.lockedUntil && new Date() < securityRecord.lockedUntil) {
      const remainingTime = Math.ceil((securityRecord.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      return NextResponse.json({ 
        isValid: false, 
        isLocked: true,
        error: `Cuenta bloqueada. Intenta en ${remainingTime} minutos.`,
        remainingAttempts: 0
      }, { status: 423 });
    }

    console.log('🔐 [Verify API] Comparando PIN...');
    const isValid = await securityRecord.comparePin(pin);
    console.log('✅ [Verify API] PIN válido:', isValid);
    
    if (isValid) {
      console.log('🔄 [Verify API] Reseteando intentos fallidos...');
      // Resetear intentos fallidos
      await Security.findByIdAndUpdate(securityRecord._id, {
        attempts: 0,
        lockedUntil: null
      });
      
      console.log('✅ [Verify API] PIN verificado exitosamente');
      return NextResponse.json({ isValid: true });
    } else {
      // Incrementar intentos fallidos
      const newAttempts = securityRecord.attempts + 1;
      const maxAttempts = 5;
      const remainingAttempts = maxAttempts - newAttempts;
      
      let updateData: any = { attempts: newAttempts };
      
      // Bloquear si se exceden los intentos
      if (newAttempts >= maxAttempts) {
        const lockDuration = 15 * 60 * 1000; // 15 minutos
        updateData.lockedUntil = new Date(Date.now() + lockDuration);
      }
      
      await Security.findByIdAndUpdate(securityRecord._id, updateData);
      
      return NextResponse.json({ 
        isValid: false,
        isLocked: newAttempts >= maxAttempts,
        remainingAttempts: Math.max(0, remainingAttempts),
        error: newAttempts >= maxAttempts 
          ? "Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos."
          : `PIN incorrecto. Te quedan ${remainingAttempts} intentos.`
      }, { status: 403 });
    }

  } catch (error: any) {
    console.error('❌ [Verify API] Error completo:', error);
    console.error('❌ [Verify API] Stack trace:', error.stack);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}