import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { compareEncrypted } from '@/lib/security';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { pin } = await request.json();
  
  if (!pin || pin.length !== 4) {
    return NextResponse.json({ isValid: false });
  }

  try {
    // Obtener PIN almacenado
    // const storedPin = await getPinFromDatabase(session.user.id);
    // const isValid = compareEncrypted(pin, storedPin);
    
    // Implementación temporal para prueba:
    const isValid = true; // Reemplazar con lógica real
    
    return NextResponse.json({ isValid });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al verificar PIN" },
      { status: 500 }
    );
  }
}