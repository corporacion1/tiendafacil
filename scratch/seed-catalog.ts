import { supabaseAdmin } from '../src/lib/supabase';
import { mockProducts, initialFamilies, initialUnits, initialWarehouses, mockAds, mockCurrencyRates } from '../src/lib/data';

async function seedCatalog() {
  console.log('🌱 Seeding catalog data in Neon (v2)...');
  try {
    const storeId = 'ST-1234567890123';

    // 1. Seed Units
    console.log('Seeding units...');
    const units = initialUnits.map(u => ({
      id: u.id,
      name: u.name,
      store_id: u.storeId || storeId
    }));
    await supabaseAdmin.from('units').insert(units);

    // 2. Seed Families
    console.log('Seeding families...');
    const families = initialFamilies.map(f => ({
      id: f.id,
      name: f.name,
      store_id: f.storeId || storeId
    }));
    await supabaseAdmin.from('families').insert(families);

    // 4. Seed Products
    console.log('Seeding products...');
    const products = mockProducts.map(p => ({
      id: p.id,
      store_id: p.storeId || storeId,
      sku: p.sku,
      name: p.name,
      description: p.description,
      family: p.family,
      price: p.price,
      wholesale_price: p.wholesalePrice,
      cost: p.cost,
      stock: p.stock,
      min_stock: 0,
      unit: p.unit,
      type: p.type,
      status: p.status,
      image_url: p.imageUrl,
      image_hint: p.imageHint,
      tax1: p.tax1,
      tax2: p.tax2,
      warehouse: p.warehouse,
      affects_inventory: p.affectsInventory,
      created_at: p.createdAt
    }));

    const { error: prodError } = await supabaseAdmin.from('products').insert(products);
    if (prodError) console.error('Error seeding products:', prodError);
    else console.log('✅ Products seeded successfully');

    // 5. Seed Currency Rates
    console.log('Seeding currency rates...');
    const rates = mockCurrencyRates.map(r => ({
      id: r.id,
      rate: r.rate,
      date: r.date,
      store_id: r.storeId || storeId,
      active: true
    }));
    await supabaseAdmin.from('currency_rates').insert(rates);

    console.log('✅ Catalog seeding completed!');
  } catch (error) {
    console.error('Unexpected error during seeding:', error);
  }
}

seedCatalog();
