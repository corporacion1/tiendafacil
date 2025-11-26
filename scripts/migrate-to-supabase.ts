// scripts/migrate-to-supabase.ts - Migrar datos y imágenes a Supabase
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { supabaseAdmin, uploadBase64Image } from '../src/lib/supabase';

interface MongoData {
  products: any[];
  stores: any[];
  users: any[];
  families: any[];
  units: any[];
  sales: any[];
  purchases: any[];
  customers: any[];
  suppliers: any[];
  warehouses: any[];
  ads: any[];
  pendingOrders: any[];
  currencyRates: any[];
}

async function createStorageBucket() {
  console.log('📦 Creando bucket de Storage para imágenes...');
  
  try {
    const { data, error } = await supabaseAdmin.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/*']
    });
    
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
    
    console.log('✅ Bucket de imágenes creado/verificado');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✅ Bucket ya existe');
    } else {
      throw error;
    }
  }
}

async function migrateImages(products: any[], ads: any[], stores: any[]): Promise<Map<string, string>> {
  console.log('\n📸 Migrando imágenes a Supabase Storage...');
  const imageMap = new Map<string, string>(); // base64 -> public URL
  
  let migratedCount = 0;
  
  // Migrar imágenes de productos
  console.log('  📦 Migrando imágenes de productos...');
  for (const product of products) {
    // Migrar imageUrl legacy si es base64
    if (product.imageUrl && product.imageUrl.startsWith('data:image')) {
      try {
        const { url } = await uploadBase64Image(
          product.imageUrl,
          `${product.sku || product.id}-main`,
          'products' // Carpeta específica
        );
        imageMap.set(product.imageUrl, url);
        migratedCount++;
        console.log(`    ✅ Imagen migrada para ${product.name}`);
      } catch (error) {
        console.log(`    ⚠️  Error migrando imagen de ${product.name}:`, error);
      }
    }
    
    // Migrar images array
    if (product.images && Array.isArray(product.images)) {
      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];
        if (img.url && img.url.startsWith('data:image')) {
          try {
            const { url } = await uploadBase64Image(
              img.url,
              `${product.sku || product.id}-${i}`,
              'products' // Carpeta específica
            );
            imageMap.set(img.url, url);
            migratedCount++;
          } catch (error) {
            console.log(`    ⚠️  Error migrando imagen ${i} de ${product.name}`);
          }
        }
      }
    }
  }
  
  // Migrar imágenes de anuncios
  console.log('  📢 Migrando imágenes de anuncios...');
  for (const ad of ads) {
    if (ad.imageUrl && ad.imageUrl.startsWith('data:image')) {
      try {
        const { url } = await uploadBase64Image(
          ad.imageUrl,
          `ad-${ad.id}`,
          'ads' // Carpeta específica
        );
        imageMap.set(ad.imageUrl, url);
        migratedCount++;
        console.log(`    ✅ Imagen migrada para anuncio ${ad.name}`);
      } catch (error) {
        console.log(`    ⚠️  Error migrando imagen de anuncio ${ad.name}`);
      }
    }
  }
  
  // Migrar logos de tiendas
  console.log('  🏪 Migrando logos de tiendas...');
  for (const store of stores) {
    if (store.logoUrl && store.logoUrl.startsWith('data:image')) {
      try {
        const { url } = await uploadBase64Image(
          store.logoUrl,
          `store-${store.id}`,
          'stores' // Carpeta específica
        );
        imageMap.set(store.logoUrl, url);
        migratedCount++;
        console.log(`    ✅ Logo migrado para tienda ${store.name}`);
      } catch (error) {
        console.log(`    ⚠️  Error migrando logo de tienda ${store.name}`);
      }
    }
  }
  
  console.log(`✅ ${migratedCount} imágenes migradas exitosamente\n`);
  return imageMap;
}

function transformProduct(product: any, imageMap: Map<string, string>) {
  // Transformar _id a id
  const id = product.id || product._id?.toString();
  
  // Reemplazar base64 con URLs de Supabase en imageUrl
  let imageUrl = product.imageUrl;
  if (imageUrl && imageMap.has(imageUrl)) {
    imageUrl = imageMap.get(imageUrl);
  }
  
  // Reemplazar base64 con URLs en images array
  let images = product.images || [];
  if (Array.isArray(images)) {
    images = images.map((img: any) => {
      if (img.url && imageMap.has(img.url)) {
        return { ...img, url: imageMap.get(img.url) };
      }
      return img;
    });
  }
  
  return {
    id,
    store_id: product.storeId,
    sku: product.sku,
    name: product.name,
    description: product.description || null,
    family: product.family || null,
    price: parseFloat(product.price) || 0,
    wholesale_price: parseFloat(product.wholesalePrice) || 0,
    cost: parseFloat(product.cost) || 0,
    stock: parseInt(product.stock) || 0,
    min_stock: parseInt(product.minStock) || 0,
    unit: product.unit || 'unidad',
    type: product.type || 'product',
    status: product.status || 'active',
    image_url: imageUrl || null,
    image_hint: product.imageHint || null,
    images: JSON.stringify(images),
    primary_image_index: product.primaryImageIndex || 0,
    created_at: product.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function migrateData() {
  console.log('🚀 Iniciando migración a Supabase...\n');
  
  // Leer datos exportados
  const exportPath = path.join(process.cwd(), 'migration-data', 'mongodb-export.json');
  if (!fs.existsSync(exportPath)) {
    throw new Error('No se encontró el archivo de exportación. Ejecuta primero: npm run export-mongodb');
  }
  
  const data: MongoData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  
  // Crear bucket de Storage
  await createStorageBucket();
  
  // Migrar imágenes primero (productos, ads, stores)
  const imageMap = await migrateImages(data.products, data.ads, data.stores);
  
  // Migrar stores
  console.log('🏪 Migrando tiendas...');
  for (const store of data.stores) {
    // Reemplazar logoUrl con URL de Storage si es base64
    let logoUrl = store.logoUrl;
    if (logoUrl && imageMap.has(logoUrl)) {
      logoUrl = imageMap.get(logoUrl);
    }
    
    const { error } = await supabaseAdmin.from('stores').upsert({
      id: store.id || store._id?.toString(),
      name: store.name,
      business_type: store.businessType || null,
      address: store.address || null,
      phone: store.phone || null,
      email: store.email || null,
      tax_id: store.taxId || null,
      logo_url: logoUrl || null,
      primary_currency: store.primaryCurrency || 'USD',
      primary_currency_symbol: store.primaryCurrencySymbol || '$',
      secondary_currency: store.secondaryCurrency || 'VES',
      secondary_currency_symbol: store.secondaryCurrencySymbol || 'Bs.',
      status: store.status || 'active',
      created_at: store.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando tienda:', error);
    else console.log(`  ✅ ${store.name}`);
  }
  
  // Migrar users
  console.log('\n👤 Migrando usuarios...');
  for (const user of data.users) {
    const { error } = await supabaseAdmin.from('users').upsert({
      id: user.id || user._id?.toString(),
      uid: user.uid,
      email: user.email,
      password: user.password,
      phone: user.phone || null,
      role: user.role || 'user',
      store_id: user.storeId || null,
      display_name: user.displayName || null,
      store_request: user.storeRequest || false,
      status: user.status || 'active',
      created_at: user.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando usuario:', error);
    else console.log(`  ✅ ${user.email}`);
  }
  
  // Migrar families
  console.log('\n📁 Migrando familias...');
  for (const family of data.families) {
    const { error } = await supabaseAdmin.from('families').upsert({
      id: family.id || family._id?.toString(),
      name: family.name,
      description: family.description || null,
      store_id: family.storeId,
      created_at: family.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando familia:', error);
    else console.log(`  ✅ ${family.name}`);
  }
  
  // Migrar units
  console.log('\n📏 Migrando unidades...');
  for (const unit of data.units) {
    const { error } = await supabaseAdmin.from('units').upsert({
      id: unit.id || unit._id?.toString(),
      name: unit.name,
      abbreviation: unit.abbreviation || null,
      store_id: unit.storeId,
      created_at: unit.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando unidad:', error);
    else console.log(`  ✅ ${unit.name}`);
  }
  
  // Migrar warehouses
  console.log('\n🏭 Migrando almacenes...');
  for (const warehouse of data.warehouses) {
    const { error } = await supabaseAdmin.from('warehouses').upsert({
      id: warehouse.id || warehouse._id?.toString(),
      store_id: warehouse.storeId,
      name: warehouse.name,
      location: warehouse.location || null,
      manager: warehouse.manager || null,
      status: warehouse.status || 'active',
      created_at: warehouse.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando almacén:', error);
    else console.log(`  ✅ ${warehouse.name}`);
  }
  
  // Migrar products
  console.log('\n📦 Migrando productos...');
  for (const product of data.products) {
    const transformed = transformProduct(product, imageMap);
    const { error } = await supabaseAdmin.from('products').upsert(transformed);
    
    if (error) console.error('Error migrando producto:', error);
    else console.log(`  ✅ ${product.name}`);
  }
  
  // Migrar currency rates
  console.log('\n💱 Migrando tasas de cambio...');
  for (const rate of data.currencyRates) {
    const { error } = await supabaseAdmin.from('currency_rates').upsert({
      id: rate.id || rate._id?.toString(),
      store_id: rate.storeId,
      from_currency: rate.fromCurrency,
      to_currency: rate.toCurrency,
      rate: parseFloat(rate.rate),
      date: rate.date,
      created_at: rate.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando tasa:', error);
    else console.log(`  ✅ ${rate.fromCurrency} -> ${rate.toCurrency}`);
  }
  
  // Migrar ads
  console.log('\n📢 Migrando anuncios...');
  for (const ad of data.ads) {
    // Reemplazar imageUrl con URL de Storage si es base64
    let imageUrl = ad.imageUrl;
    if (imageUrl && imageMap.has(imageUrl)) {
      imageUrl = imageMap.get(imageUrl);
    }
    
    const { error } = await supabaseAdmin.from('ads').upsert({
      id: ad.id || ad._id?.toString(),
      store_id: ad.storeId,
      name: ad.name,
      description: ad.description || null,
      image_url: imageUrl || null,
      image_hint: ad.imageHint || null,
      link_url: ad.linkUrl || null,
      status: ad.status || 'active',
      views: ad.views || 0,
      created_at: ad.createdAt || new Date().toISOString()
    });
    
    if (error) console.error('Error migrando anuncio:', error);
    else console.log(`  ✅ ${ad.name}`);
  }
  
  console.log('\n\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
  console.log('\n📊 Resumen:');
  console.log(`  • ${data.stores.length} tiendas`);
  console.log(`  • ${data.users.length} usuarios`);
  console.log(`  • ${data.products.length} productos`);
  console.log(`  • ${data.families.length} familias`);
  console.log(`  • ${data.units.length} unidades`);
  console.log(`  • ${data.warehouses.length} almacenes`);
  console.log(`  • ${data.ads.length} anuncios`);
  console.log(`  • ${data.currencyRates.length} tasas de cambio`);
  console.log(`  • ${imageMap.size} imágenes migradas a Storage`);
  
  process.exit(0);
}

migrateData().catch(error => {
  console.error('\n❌ Error durante la migración:', error);
  process.exit(1);
});
