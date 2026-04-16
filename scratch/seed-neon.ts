import { supabaseAdmin } from '../src/lib/supabase';

async function seedUser() {
  console.log('🌱 Seeding super user in Neon...');
  try {
    const superUser = {
      uid: 'USE-18724321371',
      email: 'corporacion1@gmail.com',
      display_name: 'Jorge Negrete',
      photo_url: 'https://i.imgur.com/8bXhQXa.png',
      phone: '+58 412-6915593',
      password: '$2b$10$3gbTS9Zq0BbLoU.cuPtRSu0qct6i7gIBzpgut.RN20YU6TgNTq8oy', // 19a1e3ef
      role: 'su',
      status: 'active',
      store_id: 'ST-1234567890123'
    };

    const { data, error } = await supabaseAdmin.from('users').insert(superUser).select().single();

    if (error) {
      console.error('Error seeding user:', error);
    } else {
      console.log('✅ Super user seeded successfully:', data.email);
    }

    const defaultStore = {
      id: 'ST-1234567890123',
      store_id: 'ST-1234567890123',
      name: "Tienda Facil DEMO",
      owner_ids: ["USE-18724321371"],
      status: 'active',
      business_type: "Tecnologia",
      primary_currency_name: "Dólar Americano",
      primary_currency_symbol: "$",
      secondary_currency_name: "Bolívar Digital",
      secondary_currency_symbol: "Bs."
    };

    const { error: storeError } = await supabaseAdmin.from('stores').insert(defaultStore);
    if (storeError) console.error('Error seeding store:', storeError);
    else console.log('✅ Default store seeded successfully');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedUser();
