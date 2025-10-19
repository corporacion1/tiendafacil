// src/app/api/debug/generate-hashes/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🔑 [Generate Hashes] Generando hashes para contraseñas...');

    const passwords = {
      '19a1e3ef': null,
      'admin1234': null,
      'seller1234': null,
      'depositary1234': null,
      'user1234': null
    };

    // Generar hashes para cada contraseña
    for (const [password, _] of Object.entries(passwords)) {
      const hash = await bcrypt.hash(password, 10);
      passwords[password] = hash;
      console.log(`🔒 [Generate Hashes] ${password} -> ${hash}`);
    }

    // Generar el código para data.ts
    const dataCode = `
// Contraseñas hasheadas para data.ts
const hashedPasswords = {
  '19a1e3ef': '${passwords['19a1e3ef']}',
  'admin1234': '${passwords['admin1234']}',
  'seller1234': '${passwords['seller1234']}',
  'depositary1234': '${passwords['depositary1234']}',
  'user1234': '${passwords['user1234']}'
};

// Usuarios actualizados con contraseñas hasheadas:
export let defaultUsers: UserProfile[] = [
  {
    uid: '5QLaiiIr4mcGsjRXVGeGx50nrpk1',
    email: 'corporacion1@gmail.com',
    displayName: 'Jorge Negrete',
    photoURL: 'https://i.imgur.com/8bXhQXa.png',
    phone: '+58 412-6915593',
    password: '${passwords['19a1e3ef']}', // 19a1e3ef
    role: 'su',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'admin_demo_001',
    email: 'admin@tiendafacil.com',
    displayName: 'Admin Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '${passwords['admin1234']}', // admin1234
    role: 'admin',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'seller_demo_001',
    email: 'pos@tiendafacil.com',
    displayName: 'POS Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '${passwords['seller1234']}', // seller1234
    role: 'seller',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'depositary_demo_001',
    email: 'depositary@tiendafacil.com',
    displayName: 'Depositary Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '${passwords['depositary1234']}', // depositary1234
    role: 'depositary',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user_demo_001',
    email: 'demo@tiendafacil.com',
    displayName: 'User Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '${passwords['user1234']}', // user1234
    role: 'user',
    status: 'active',
    storeId: defaultStoreId,
    storeRequest: true,
  }
];
`;

    return NextResponse.json({
      success: true,
      message: 'Hashes generados exitosamente',
      passwords,
      dataCode,
      credentials: [
        { email: 'corporacion1@gmail.com', password: '19a1e3ef' },
        { email: 'admin@tiendafacil.com', password: 'admin1234' },
        { email: 'pos@tiendafacil.com', password: 'seller1234' },
        { email: 'depositary@tiendafacil.com', password: 'depositary1234' },
        { email: 'demo@tiendafacil.com', password: 'user1234' }
      ]
    });

  } catch (error: any) {
    console.error('❌ [Generate Hashes] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error generando hashes',
        error: error.message
      },
      { status: 500 }
    );
  }
}