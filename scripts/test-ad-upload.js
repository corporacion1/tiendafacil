const mongoose = require('mongoose');
const fs = require('fs');

async function main(){
  const MONGO_URI = process.env.MONGO_URI;
  if(!MONGO_URI){
    console.error('MONGO_URI not set');
    process.exit(2);
  }
  await mongoose.connect(MONGO_URI, { dbName: 'tiendafacil' });
  const db = mongoose.connection.db;
  const GridFSBucket = mongoose.mongo.GridFSBucket;
  const bucket = new GridFSBucket(db, { bucketName: 'images' });

  // 1x1 PNG
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
  const buffer = Buffer.from(pngBase64, 'base64');

  const uploadStream = bucket.openUploadStream('test-ad-upload.png', { contentType: 'image/png' });
  uploadStream.end(buffer);

  uploadStream.on('finish', async () => {
    const fileId = uploadStream.id ? uploadStream.id.toString() : undefined;
    console.log('Uploaded file id:', fileId);
    const imageUrl = `/api/images/${fileId}`;

    const adsColl = db.collection('ads');
    const adId = 'TEST-AD-' + Date.now();
    const adDoc = {
      id: adId,
      name: 'Test Ad from script',
      sku: 'TEST-AD',
      price: 0,
      status: 'active',
      description: 'Inserted by test script',
      imageUrl,
      imageHint: 'test-image',
      targetBusinessTypes: ['Test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      primaryImageIndex: 0,
      images: [ { index: 0, id: 'img-'+Date.now(), url: imageUrl, alt: 'test', order: 0, isPrimary: true } ]
    };

    const res = await adsColl.insertOne(adDoc);
    console.log('Inserted ad id:', adId);

    const found = await adsColl.findOne({ id: adId });
    console.log('Found ad:', JSON.stringify({ id: found.id, imageUrl: found.imageUrl }, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  });

  uploadStream.on('error', (err) => {
    console.error('Upload error', err);
    process.exit(1);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
