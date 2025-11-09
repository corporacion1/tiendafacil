// scripts/export-mongodb.ts - Exportar datos de MongoDB para migración
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno desde .env y .env.local
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { connectToDatabase } from '../src/lib/mongodb';

async function exportData() {
  console.log('🔌 Conectando a MongoDB...');
  await connectToDatabase();
  
  const mongoose = await import('mongoose');
  const db = mongoose.default.connection.db;
  
  if (!db) {
    throw new Error('Database connection not established');
  }

  console.log('📦 Exportando datos...');
  
  // Exportar productos
  const products = await db.collection('products').find({}).toArray();
  console.log(`✅ Productos exportados: ${products.length}`);
  
  // Exportar stores
  const stores = await db.collection('stores').find({}).toArray();
  console.log(`✅ Tiendas exportadas: ${stores.length}`);
  
  // Exportar users
  const users = await db.collection('users').find({}).toArray();
  console.log(`✅ Usuarios exportados: ${users.length}`);
  
  // Exportar families
  const families = await db.collection('families').find({}).toArray();
  console.log(`✅ Familias exportadas: ${families.length}`);
  
  // Exportar units
  const units = await db.collection('units').find({}).toArray();
  console.log(`✅ Unidades exportadas: ${units.length}`);
  
  // Exportar sales
  const sales = await db.collection('sales').find({}).toArray();
  console.log(`✅ Ventas exportadas: ${sales.length}`);
  
  // Exportar purchases
  const purchases = await db.collection('purchases').find({}).toArray();
  console.log(`✅ Compras exportadas: ${purchases.length}`);
  
  // Exportar customers
  const customers = await db.collection('costumers').find({}).toArray();
  console.log(`✅ Clientes exportados: ${customers.length}`);
  
  // Exportar suppliers
  const suppliers = await db.collection('suppliers').find({}).toArray();
  console.log(`✅ Proveedores exportados: ${suppliers.length}`);
  
  // Exportar warehouses
  const warehouses = await db.collection('warehouses').find({}).toArray();
  console.log(`✅ Almacenes exportados: ${warehouses.length}`);
  
  // Exportar ads
  const ads = await db.collection('ads').find({}).toArray();
  console.log(`✅ Anuncios exportados: ${ads.length}`);
  
  // Exportar pending orders
  const pendingOrders = await db.collection('pendingorders').find({}).toArray();
  console.log(`✅ Pedidos pendientes exportados: ${pendingOrders.length}`);
  
  // Exportar currency rates
  const currencyRates = await db.collection('currencyrates').find({}).toArray();
  console.log(`✅ Tasas de cambio exportadas: ${currencyRates.length}`);

  // Crear directorio de exportación
  const exportDir = path.join(process.cwd(), 'migration-data');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Guardar datos
  const data = {
    products,
    stores,
    users,
    families,
    units,
    sales,
    purchases,
    customers,
    suppliers,
    warehouses,
    ads,
    pendingOrders,
    currencyRates,
    exportDate: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(exportDir, 'mongodb-export.json'),
    JSON.stringify(data, null, 2)
  );

  console.log('\n✅ Exportación completada!');
  console.log(`📁 Archivo guardado en: ${path.join(exportDir, 'mongodb-export.json')}`);
  
  process.exit(0);
}

exportData().catch(error => {
  console.error('❌ Error durante la exportación:', error);
  process.exit(1);
});
