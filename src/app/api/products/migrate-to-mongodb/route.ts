import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';

/**
 * POST - Migrar imágenes base64 a GridFS y normalizar URLs rotas a placeholder
 * Body: { storeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId } = body || {};

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

  await connectToDatabase();

  const db = mongoose.connection.db!;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });

    console.log('🚀 [migrate-to-mongodb] Iniciando migración para storeId=', storeId);

    const products = await Product.find({ storeId });
    console.log(`📦 [migrate-to-mongodb] Productos encontrados: ${products.length}`);

    let migratedImages = 0;
    let updatedProducts = 0;
    const errors: string[] = [];

    for (const product of products) {
      let changed = false;

      // Ensure images array exists
      if (!Array.isArray(product.images)) product.images = [];

      // If legacy imageUrl exists and images array empty, move it to images as placeholder/url
      if (product.imageUrl && (!product.images || product.images.length === 0)) {
        product.images = [{
          id: `migrated-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          url: product.imageUrl,
          thumbnailUrl: product.imageUrl,
          alt: product.imageHint || product.name,
          order: 0,
          uploadedAt: product.createdAt || new Date().toISOString(),
          size: product.images && product.images[0]?.size ? product.images[0].size : 0
        }];
        product.primaryImageIndex = 0;
        changed = true;
      }

      // Iterate existing images and migrate base64 -> GridFS, and normalize broken supabase URLs
      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];

        if (!img || !img.url) continue;

        try {
          // base64 data URI
          if (String(img.url).startsWith('data:')) {
            const match = /^data:(.+?);base64,(.+)$/.exec(img.url);
            if (!match) throw new Error('Formato data URI inválido');

            const contentType = match[1] || 'application/octet-stream';
            const b64 = match[2];
            const buffer = Buffer.from(b64, 'base64');

            const filename = `prod-${product.id}-${img.id || i}`;
            const uploadStream = bucket.openUploadStream(filename, { contentType });

            // Write buffer and wait for finish/error — end(cb) signature doesn't provide error param
            uploadStream.end(buffer);
            await new Promise<void>((resolve, reject) => {
              uploadStream.on('finish', () => resolve());
              uploadStream.on('error', (e: any) => reject(e));
            });

            const uploadedId = uploadStream.id;

            // Replace url with our new streaming endpoint
            img.url = `/api/images/${uploadedId.toString()}`;
            img.thumbnailUrl = img.url;
            img.size = buffer.length;
            img.uploadedAt = new Date().toISOString();
            // remove supabasePath if present
            delete (img as any).supabasePath;

            migratedImages++;
            changed = true;
            console.log(`✅ [migrate] Subida GridFS: product=${product.id} image=${img.id || i} id=${uploadedId}`);
          } else {
            // If it's an external URL that points to supabase domain, replace with placeholder
            if (String(img.url).includes('supabase.co') || String(img.url).includes('storage/v1/object/public')) {
              // We assume the old bucket may be gone; replace with placeholder route
              img.url = `/api/images/placeholder`;
              img.thumbnailUrl = img.url;
              img.size = img.size || 0;
              changed = true;
            }
            // else keep external or other urls (e.g., unsplash)
          }

        } catch (err: any) {
          const errMsg = `Error procesando imagen product=${product.id} idx=${i}: ${err.message || err}`;
          console.error('❌ [migrate] ', errMsg);
          errors.push(errMsg);
        }
      }

      if (changed) {
        try {
          await Product.updateOne({ _id: product._id }, { $set: { images: product.images, primaryImageIndex: product.primaryImageIndex || 0, imageUrl: '' } });
          updatedProducts++;
        } catch (err: any) {
          const errMsg = `Error guardando producto ${product.id}: ${err.message || err}`;
          console.error('❌ [migrate] ', errMsg);
          errors.push(errMsg);
        }
      }
    }

    console.log(`🎉 [migrate-to-mongodb] Completado. Migrated images: ${migratedImages}, updated products: ${updatedProducts}`);

    return NextResponse.json({ success: true, migratedImages, updatedProducts, errors });

  } catch (error: any) {
    console.error('❌ [migrate-to-mongodb] Error fatal:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
