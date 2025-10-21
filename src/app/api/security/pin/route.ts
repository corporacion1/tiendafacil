import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Security from '@/models/Security';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  await connectToDatabase();
  const session = await getSession(request);
  
  console.log('🔐 [PIN API] POST recibido');
  console.log('👤 [PIN API] Session:', session?.user?.id);
  
  if (!session?.user?.id) {
    console.error('❌ [PIN API] No autorizado - sin sesión');
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currentPin, newPin } = await request.json();
  
  console.log('📦 [PIN API] Datos recibidos:', { 
    hasCurrentPin: !!currentPin, 
    currentPinLength: currentPin?.length,
    newPinLength: newPin?.length 
  });

  // Validación
  if (!newPin || !/^\d{4}$/.test(newPin)) {
    console.error('❌ [PIN API] PIN inválido:', newPin);
    return NextResponse.json({ error: "El PIN debe tener 4 dígitos" }, { status: 400 });
  }

  try {
    const securityRecord = await Security.findOne({ userId: session.user.id }).select('+pin');
    console.log('🔍 [PIN API] Registro existente:', !!securityRecord);

    // Verificar PIN actual si ya existe uno
    if (securityRecord) {
      console.log('🔐 [PIN API] Ya existe PIN, verificando currentPin...');
      
      if (!currentPin || currentPin === '') {
        console.error('❌ [PIN API] Se requiere PIN actual para cambiar');
        return NextResponse.json({ error: "Se requiere el PIN actual" }, { status: 400 });
      }
      
      const isMatch = await securityRecord.comparePin(currentPin);
      console.log('🔐 [PIN API] PIN actual coincide:', isMatch);
      
      if (!isMatch) {
        console.error('❌ [PIN API] PIN actual incorrecto');
        return NextResponse.json({ error: "PIN actual incorrecto" }, { status: 403 });
      }
      
      // Actualizar existente
      console.log('📝 [PIN API] Actualizando PIN existente...');
      securityRecord.pin = newPin;
      securityRecord.attempts = 0;
      securityRecord.lockedUntil = null;
      securityRecord.lastChanged = new Date();
      await securityRecord.save();
      console.log('✅ [PIN API] PIN actualizado exitosamente');
    } else {
      // Crear nuevo
      console.log('📝 [PIN API] Creando nuevo PIN...');
      await Security.create({
        userId: session.user.id,
        pin: newPin,
        attempts: 0,
        lockedUntil: null,
        lastChanged: new Date()
      });
      console.log('✅ [PIN API] PIN creado exitosamente');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [PIN API] Error:', error);
    return NextResponse.json(
      { error: "Error al actualizar PIN" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await connectToDatabase();
  const session = await getSession(request);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await Security.findOneAndDelete({ userId: session.user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar PIN" },
      { status: 500 }
    );
  }
}