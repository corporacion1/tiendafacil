// test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

console.log('Intentando conectar a MongoDB Atlas...');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ ¡Conexión exitosa!');
    mongoose.connection.close(); // Cierra la conexión después de probar
  })
  .catch(err => {
    console.error('❌ ERROR al conectar:');
    console.error(err.message);
    if (err.name === 'MongoParseError') {
      console.error('\n💡 PROBABLE CAUSA: Caracteres especiales en la contraseña (como !)');
      console.error('👉 Solución: Codifica la contraseña o cámbiala por una sin símbolos.');
    }
  });