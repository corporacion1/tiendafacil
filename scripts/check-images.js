// scripts/check-images.js
// Uso: node scripts/check-images.js <storeId>
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const storeId = process.argv[2];
  if (!storeId) {
    console.error('Uso: node scripts/check-images.js <storeId>');
    process.exit(1);
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI no definida en .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { dbName: 'tiendafacil' });
  const db = mongoose.connection.db;
  const Product = db.collection('products');
  const filesColl = db.collection('images.files');

  const totalProducts = await Product.countDocuments({ storeId });
  const products = await Product.find({ storeId }).limit(50).toArray();

  let productsWithImages = 0;
  let productsWithBase64 = 0;
  let productsWithSupabaseUrl = 0;
  let productsWithGridFsUrl = 0;
  let productsWithExternal = 0;

  const samples = [];

  for (const p of products) {
    const imgs = Array.isArray(p.images) ? p.images : [];
    if (imgs.length > 0) productsWithImages++;

    let hasBase64 = false, hasSupabase = false, hasGrid = false, hasExternal = false;
    for (const img of imgs) {
      const url = String(img.url || '');
      if (url.startsWith('data:')) hasBase64 = true;
      else if (url.startsWith('/api/images/')) hasGrid = true;
      else if (url.includes('supabase.co') || url.includes('storage/v1/object/public')) hasSupabase = true;
      else if (url.startsWith('http')) hasExternal = true;
    }

    if (hasBase64) productsWithBase64++;
    if (hasSupabase) productsWithSupabaseUrl++;
    if (hasGrid) productsWithGridFsUrl++;
    if (hasExternal) productsWithExternal++;

    samples.push({ id: p.id, name: p.name, images: imgs.slice(0,3).map(i => ({ url: i.url, size: i.size })) });
  }

  const filesCount = await filesColl.countDocuments();

  const out = {
    storeId,
    totalProducts,
    inspected: products.length,
    productsWithImages,
    productsWithBase64,
    productsWithSupabaseUrl,
    productsWithGridFsUrl,
    productsWithExternal,
    gridFsFilesTotal: filesCount,
    samples: samples.slice(0,10)
  };

  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
