// Seed script for MongoDB using demo data from data.ts
// Run with: npx ts-node scripts/seed-db.ts

import mongoose from 'mongoose';
import {
  defaultStore,
  defaultUsers,
  mockProducts,
  mockAds,
  initialFamilies,
  initialWarehouses,
  mockCurrencyRates,
  defaultCustomers,
  defaultSuppliers,
  initialUnits,
  mockOrders,
  mockSales,
  mockPurchases,
  mockInventoryMovements,
  mockCashSessions
} from '../src/lib/data.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiendafacil';

async function seed() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;

  // Drop all collections for a clean start
  await db.dropDatabase();

  // Models (define minimal schemas for direct insert)
  const Store = db.collection('stores');
  const User = db.collection('users');
  const Product = db.collection('products');
  const Ad = db.collection('ads');
  const Family = db.collection('families');
  const Warehouse = db.collection('warehouses');
  const CurrencyRate = db.collection('currencyrates');
  const Customer = db.collection('customers');
  const Supplier = db.collection('suppliers');
  const Unit = db.collection('units');
  const Order = db.collection('orders');
  const Sale = db.collection('sales');
  const Purchase = db.collection('purchases');
  const InventoryMovement = db.collection('inventorymovements');
  const CashSession = db.collection('cashsessions');

  // Insert demo data
  await Store.insertOne(defaultStore);
  await User.insertMany(defaultUsers);
  await Product.insertMany(mockProducts);
  await Ad.insertMany(mockAds);
  await Family.insertMany(initialFamilies);
  await Warehouse.insertMany(initialWarehouses);
  await CurrencyRate.insertMany(mockCurrencyRates);
  await Customer.insertMany(defaultCustomers);
  await Supplier.insertMany(defaultSuppliers);
  await Unit.insertMany(initialUnits);
  await Order.insertMany(mockOrders);
  await Sale.insertMany(mockSales);
  await Purchase.insertMany(mockPurchases);
  await InventoryMovement.insertMany(mockInventoryMovements);
  await CashSession.insertMany(mockCashSessions);

  console.log('✅ Seed completed!');
  await db.close();
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
