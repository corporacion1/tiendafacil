// src/app/api/debug/test-seed/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { defaultUsers } from '@/lib/data';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Seed] Iniciando test de seed de usuarios...');

    const testStoreId = 'test_store_123';

    // Limpiar usuarios de test
    await User.deleteMany({ storeId: testStoreId });
    console.log('🧹 [Test Seed] Usuarios de test eliminados');

    // Preparar usuarios con contraseñas hasheadas
    console.log('🔒 [Test Seed] Procesando usuarios de data.ts...');
    console.log('📊 [Test Seed] Usuarios encontrados:', defaultUsers.length);

    const usersWithHashedPasswords = [];

    for (const user of defaultUsers) {
      console.log(`👤 [Test Seed] Procesando usuario: ${user.email}`);
      console.log(`🔍 [Test Seed] Tiene contraseña: ${!!user.password}`);
      console.log(`🔍 [Test Seed] Contraseña original: ${user.password}`);

      if (user.password) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        console.log(`🔑 [Test Seed] Contraseña hasheada: ${hashedPassword.substring(0, 30)}...`);
        
        const userWithHashedPassword = {
          ...user,
          password: hashedPassword,
          storeId: testStoreId
        };
        
        usersWithHashedPasswords.push(userWithHashedPassword);
        console.log(`✅ [Test Seed] Usuario preparado: ${user.email}`);
      } else {
        console.log(`⚠️ [Test Seed] Usuario sin contraseña: ${user.email}`);
        usersWithHashedPasswords.push({ ...user, storeId: testStoreId });
      }
    }

    console.log(`📦 [Test Seed] Insertando ${usersWithHashedPasswords.length} usuarios...`);

    // Insertar usuarios uno por uno para mejor debugging
    const insertResults = [];
    for (const user of usersWithHashedPasswords) {
      try {
        console.log(`💾 [Test Seed] Insertando usuario: ${user.email}`);
        console.log(`🔍 [Test Seed] Datos del usuario:`, {
          email: user.email,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0,
          uid: user.uid,
          role: user.role
        });

        const createdUser = await User.create(user);
        console.log(`✅ [Test Seed] Usuario creado con ID: ${createdUser._id}`);
        
        insertResults.push({
          email: user.email,
          success: true,
          id: createdUser._id,
          hasPassword: !!createdUser.password
        });
      } catch (insertError) {
        console.error(`❌ [Test Seed] Error insertando usuario ${user.email}:`, insertError);
        insertResults.push({
          email: user.email,
          success: false,
          error: insertError.message
        });
      }
    }

    // Verificar usuarios creados usando MongoDB directo
    console.log('🔍 [Test Seed] Verificando usuarios creados...');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const createdUsers = await usersCollection.find({ storeId: testStoreId }).toArray();
    console.log(`📊 [Test Seed] Usuarios encontrados en DB: ${createdUsers.length}`);

    const verificationResults = createdUsers.map(user => ({
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordPreview: user.password ? user.password.substring(0, 20) + '...' : null,
      allFields: Object.keys(user)
    }));

    return NextResponse.json({
      success: true,
      message: 'Test de seed completado',
      originalUsers: defaultUsers.map(u => ({
        email: u.email,
        hasPassword: !!u.password,
        originalPassword: u.password
      })),
      insertResults,
      verificationResults,
      stats: {
        totalProcessed: usersWithHashedPasswords.length,
        totalCreated: createdUsers.length,
        usersWithPassword: verificationResults.filter(u => u.hasPassword).length
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Seed] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de seed',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}