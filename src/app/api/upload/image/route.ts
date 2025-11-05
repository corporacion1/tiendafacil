import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.warn('[api/upload/image] No file found in formData');
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
    }

    // Basic validation
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) { // allow up to 10MB for safety
      return NextResponse.json({ error: 'La imagen debe ser menor a 10MB' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Connect to MongoDB and upload to GridFS
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'DB no disponible' }, { status: 500 });
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
    const filename = (file as any).name || `upload-${Date.now()}`;
    const uploadStream = bucket.openUploadStream(filename, { contentType: file.type });

    // Write buffer and wait for finish
    uploadStream.write(buffer);
    uploadStream.end();

    await new Promise<void>((resolve, reject) => {
      uploadStream.on('finish', () => resolve());
      uploadStream.on('error', (err) => reject(err));
    });

    const uploadedId = uploadStream.id;
    const publicUrl = `/api/images/${uploadedId.toString()}`;

    console.log('[api/upload/image] Uploaded to GridFS:', { id: uploadedId.toString(), url: publicUrl });

    return NextResponse.json({ url: publicUrl, id: uploadedId.toString() });

  } catch (error: any) {
    console.error('[api/upload/image] Unexpected error in route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al subir la imagen' }, { status: 500 });
  }
}