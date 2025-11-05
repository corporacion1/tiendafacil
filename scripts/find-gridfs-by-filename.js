// scripts/find-gridfs-by-filename.js
// Usage: node scripts/find-gridfs-by-filename.js <substring1> [substring2 ...]
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const parts = process.argv.slice(2);
  if (parts.length === 0) {
    console.error('Usage: node scripts/find-gridfs-by-filename.js <substring1> [substring2 ...]');
    process.exit(1);
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { dbName: 'tiendafacil' });
  const db = mongoose.connection.db;
  const filesColl = db.collection('images.files');

  for (const p of parts) {
    const q = { filename: { $regex: p, $options: 'i' } };
    const found = await filesColl.find(q).toArray();
    console.log(`\nSearch: "${p}" -> ${found.length} results`);
    for (const f of found) {
      console.log(`  id: ${f._id.toString()} filename: ${f.filename} length:${f.length} contentType:${f.contentType || ''}`);
    }
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
