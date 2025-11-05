import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';

/**
 * POST - Agregar UNA imagen adicional a un producto (SIMPLE)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Add Image] Iniciando...');
    
    await connectToDatabase();
    
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const storeId = formData.get('storeId') as string;
    const file = formData.get('image') as File;
    
    console.log('📋 [Add Image] Parámetros:', { productId, storeId, fileName: file?.name });
    
    if (!productId || !storeId || !file) {
      return NextResponse.json({ 
        error: 'productId, storeId y image son requeridos' 
      }, { status: 400 });
    }
    
    // Buscar producto
    const product = await Product.findOne({ id: productId, storeId });
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [Add Image] Producto encontrado:', product.name);
    
  // Subir imagen a GridFS
  console.log('📤 [Add Image] Subiendo a GridFS...');
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const conn = await connectToDatabase();
  const nativeDb = conn.db!;
  const bucket = new mongoose.mongo.GridFSBucket(nativeDb, { bucketName: 'images' });
  const filename = (file as any).name || `upload-${Date.now()}`;
  const uploadStream = bucket.openUploadStream(filename, { contentType: file.type });
  uploadStream.write(buffer);
  uploadStream.end();
  await new Promise((resolve, reject) => { uploadStream.on('finish', resolve); uploadStream.on('error', reject); });
  const uploadedId = uploadStream.id;
  const uploadResult = { url: `/api/images/${uploadedId.toString()}`, path: uploadedId.toString() };
  console.log('✅ [Add Image] Subida exitosa:', uploadResult.url);
    
    // Obtener imágenes actuales
    let currentImages = product.images || [];
    
    // Si no tiene imágenes pero sí imageUrl, migrar primero
    if (currentImages.length === 0 && product.imageUrl) {
      console.log('🔄 [Add Image] Migrando imagen existente...');
      currentImages = [{
        id: `migrated-${Date.now()}`,
        url: product.imageUrl,
        thumbnailUrl: product.imageUrl,
        alt: product.imageHint || product.name,
        order: 0,
        uploadedAt: new Date().toISOString()
      }];
    }
    
    // Crear nueva imagen
    const newImage = {
      id: `img-${Date.now()}`,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.url,
      alt: file.name.replace(/\.[^/.]+$/, ''),
      order: currentImages.length,
      uploadedAt: new Date().toISOString(),
      // supabasePath removed (we no longer use Supabase)
      uploadedId: uploadResult.path
    };
    
    // Combinar imágenes
    const allImages = [...currentImages, newImage];
    
    console.log('🔄 [Add Image] Actualizando BD:', {
      previousCount: currentImages.length,
      newCount: 1,
      totalCount: allImages.length
    });
    
    // Actualizar producto
    const updateData: any = {
      images: allImages,
      primaryImageIndex: 0
    };
    
    // Si es la primera imagen, actualizar campos de compatibilidad
    if (currentImages.length === 0) {
      updateData.imageUrl = allImages[0].url;
      updateData.imageHint = allImages[0].alt;
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId, storeId },
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Error actualizando producto' }, { status: 500 });
    }
    
    console.log('✅ [Add Image] Producto actualizado. Total imágenes:', updatedProduct.images?.length);
    
    return NextResponse.json({
      success: true,
      message: 'Imagen agregada exitosamente',
      totalImages: updatedProduct.images?.length || 0,
      newImageUrl: uploadResult.url,
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('❌ [Add Image] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}