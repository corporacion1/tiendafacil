// src/app/api/debug/safe-seed-test/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { defaultUsers } from '@/lib/data';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Safe Seed Test] Iniciando test seguro de seed...');

    const testStoreId = 'safe_test_store_456';

    // Usar MongoDB directo para evitar problemas con Mongoose
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Limpiar solo usuarios de test
    await usersCollection.deleteMany({ storeId: testStoreId });
    console.log('🧹 [Safe Seed Test] Usuarios de test eliminados');

    // Preparar usuarios con contraseñas hasheadas
    console.log('🔒 [Safe Seed Test] Hasheando contraseñas...');
    
    const usersToInsert = [];
    for (const user of defaultUsers) {
      if (user.password) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        console.log(`🔑 [Safe Seed Test] ${user.email}: ${user.password} -> hasheada`);
        
        usersToInsert.push({
          uid: user.uid,
          email: `test_${user.email}`, // Prefijo para evitar duplicados
          password: hashedPassword,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phone: user.phone,
          role: user.role,
          status: user.status,
          storeId: testStoreId,
          storeRequest: user.storeRequest || false,
          createdAt: new Date().toISOString()
        });
      }
    }

    console.log(`📦 [Safe Seed Test] Insertando ${usersToInsert.length} usuarios...`);

    // Insertar usuarios usando MongoDB directo
    const insertResult = await usersCollection.insertMany(usersToInsert);
    console.log(`✅ [Safe Seed Test] ${insertResult.insertedCount} usuarios insertados`);

    // Verificar usuarios creados
    const createdUsers = await usersCollection.find({ storeId: testStoreId }).toArray();
    
    const verificationResults = createdUsers.map(user => ({
      email: user.email,
      originalEmail: user.email.replace('test_', ''),
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      role: user.role,
      originalPassword: defaultUsers.find(u => u.email === user.email.replace('test_', ''))?.password
    }));

    return NextResponse.json({
      success: true,
      message: 'Test seguro de seed completado exitosamente',
      stats: {
        usersProcessed: defaultUsers.length,
        usersInserted: insertResult.insertedCount,
        usersWithPassword: verificationResults.filter(u => u.hasPassword).length
      },
      testCredentials: verificationResults.map(u => ({
        email: u.email,
        password: u.originalPassword,
        role: u.role
      })),
      verificationResults
    });

  } catch (error: any) {
    console.error('❌ [Safe Seed Test] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test seguro de seed',
        error: error.message
      },
      { status: 500 }
    );
  }
}