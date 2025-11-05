import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

/**
 * GET - Debug: Ver todas las imágenes en la base de datos
 * Dev-only. Query params:
 *  - storeId (required)
 *  - format (optional): summary | full | base64only
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const format = (searchParams.get('format') || 'summary') as 'summary' | 'full' | 'base64only';

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    console.log('🔍 [Debug Images] Consultando imágenes para store:', storeId);

    const productsWithImages = await Product.find({
      storeId,
      $or: [
        { imageUrl: { $exists: true, $ne: '' } },
        { images: { $exists: true, $not: { $size: 0 } } }
      ]
    }).lean();

    console.log(`📊 [Debug Images] Encontrados ${productsWithImages.length} productos con imágenes`);

    const result: any = {
      storeId,
      totalProducts: productsWithImages.length,
      products: productsWithImages.map((product: any) => {
        const productData: any = { id: product.id, name: product.name, _id: product._id };

        if (product.imageUrl) {
          const isBase64 = typeof product.imageUrl === 'string' && product.imageUrl.startsWith('data:image');
          productData.legacyImage = {
            exists: true,
            isBase64,
            type: isBase64 ? 'base64' : 'url',
            size: product.imageUrl ? product.imageUrl.length : 0,
            preview: format === 'full' ? product.imageUrl : (product.imageUrl ? product.imageUrl.substring(0, 100) + '...' : '')
          };
          if (format === 'base64only' && isBase64) productData.legacyImage.fullData = product.imageUrl;
        }

        if (product.images && product.images.length > 0) {
          productData.multipleImages = {
            count: product.images.length,
            images: product.images.map((img: any) => {
              const isBase64 = img.url && typeof img.url === 'string' && img.url.startsWith('data:image');
              const imageData: any = {
                id: img.id,
                order: img.order,
                alt: img.alt,
                isBase64,
                type: isBase64 ? 'base64' : 'url',
                size: img.url ? img.url.length : 0,
                preview: format === 'full' ? img.url : (img.url ? img.url.substring(0, 100) + '...' : 'No URL')
              };
              if (format === 'base64only' && isBase64) imageData.fullData = img.url;
              return imageData;
            })
          };
        }

        return productData;
      })
    };

    let base64Count = 0;
    let urlCount = 0;
    let totalImageSize = 0;

    productsWithImages.forEach((product: any) => {
      if (product.imageUrl) {
        if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('data:image')) {
          base64Count++; totalImageSize += product.imageUrl.length;
        } else {
          urlCount++;
        }
      }
      if (product.images) {
        product.images.forEach((img: any) => {
          if (img.url) {
            if (typeof img.url === 'string' && img.url.startsWith('data:image')) {
              base64Count++; totalImageSize += img.url.length;
            } else {
              urlCount++;
            }
          }
        });
      }
    });

    result.statistics = {
      base64Images: base64Count,
      urlImages: urlCount,
      totalBase64Size: totalImageSize,
      averageBase64Size: base64Count > 0 ? Math.round(totalImageSize / base64Count) : 0
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [Debug Images] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}