import { NextResponse } from 'next/server';
// IMPORTANTE: Importa el modelo así, no via destructuring
import { CurrencyRate } from '@/models/CurrencyRate';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    // Busca TODOS los registros, puedes paginar si quieres luego
    const rates = await CurrencyRate.find({ storeId }).lean();
    return NextResponse.json(rates);
  } catch (error: any) {
    console.error('Error fetching currency rates:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener las tasas de cambio', detalles: error.message },
      { status: 500 }
    );
  }
}
