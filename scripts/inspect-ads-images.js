const mongoose = require('mongoose');

async function main(){
  const uri = process.env.MONGO_URI;
  if(!uri){
    console.error('MONGO_URI not set in environment');
    process.exit(2);
  }
  await mongoose.connect(uri, { dbName: 'tiendafacil', useNewUrlParser: true, useUnifiedTopology: true });
  const coll = mongoose.connection.collection('ads');
  const docs = await coll.find({}, { projection: { id:1, name:1, imageUrl:1 } }).toArray();
  console.log(JSON.stringify({ count: docs.length, ads: docs.map(d => ({ id: d.id || d._id, name: d.name, imageUrl: d.imageUrl })) }, null, 2));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('ERROR', err);
  process.exit(1);
});
