import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, context: any) {
  try {
    // context.params can be an object or a Promise depending on runtime/typegen
    const params = await Promise.resolve(context?.params ?? {});
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // placeholder route
    if (id === 'placeholder') {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='20'>No image</text></svg>`;
      return new Response(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
    }

    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'DB no disponible' }, { status: 500 });
    }

    const filesColl = db.collection('images.files');

    let objectId: any;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const fileDoc = await filesColl.findOne({ _id: objectId });
    if (!fileDoc) return NextResponse.json({ error: 'no encontrado' }, { status: 404 });

    const contentType = fileDoc.contentType || 'application/octet-stream';
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
    const downloadStream = bucket.openDownloadStream(objectId);

    return new Response(downloadStream as any, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' } });

  } catch (error: any) {
    console.error('❌ [images route] Error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
