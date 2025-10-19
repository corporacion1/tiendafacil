import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'store_clifp94l0000008l3b1z9f8j7';
    
    const products = await Product.find({ storeId }).lean();
    
    return NextResponse.json({
      success: true,
      storeId,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      promotionProducts: products.filter(p => p.status === 'promotion').length,
      inStockProducts: products.filter(p => p.stock > 0).length,
      sampleProducts: products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        stock: p.stock,
        storeId: p.storeId
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}