import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Security from '@/models/Security';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  await connectToDatabase();
  const session = await getSession(request);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currentPin, newPin } = await request.json();

  // Validación
  if (!newPin || !/^\d{4}$/.test(newPin)) {
    return NextResponse.json({ error: "El PIN debe tener 4 dígitos" }, { status: 400 });
  }

  try {
    const securityRecord = await Security.findOne({ userId: session.user.id });

    // Verificar PIN actual si ya existe uno
    if (securityRecord) {
      if (!currentPin) {
        return NextResponse.json({ error: "Se requiere el PIN actual" }, { status: 400 });
      }
      
      const isMatch = await securityRecord.comparePin(currentPin);
      if (!isMatch) {
        return NextResponse.json({ error: "PIN actual incorrecto" }, { status: 403 });
      }
    }

    // Actualizar o crear registro
    if (securityRecord) {
      // Actualizar existente
      securityRecord.pin = newPin;
      securityRecord.attempts = 0;
      securityRecord.lockedUntil = null;
      securityRecord.lastChanged = new Date();
      await securityRecord.save();
    } else {
      // Crear nuevo
      await Security.create({
        userId: session.user.id,
        pin: newPin,
        attempts: 0,
        lockedUntil: null,
        lastChanged: new Date()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
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