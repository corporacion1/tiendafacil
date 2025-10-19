// src/app/api/debug/simple-seed-fix/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { defaultUsers } from '@/lib/data';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🔧 [Simple Seed Fix] Iniciando arreglo simple de usuarios...');

    // Usar MongoDB directo
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('🔒 [Simple Seed Fix] Procesando usuarios de data.ts...');
    
    const results = [];
    
    for (const user of defaultUsers) {
      try {
        console.log(`👤 [Simple Seed Fix] Procesando: ${user.email}`);
        
        if (!user.password) {
          console.log(`⚠️ [Simple Seed Fix] Usuario sin contraseña: ${user.email}`);
          continue;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        console.log(`🔑 [Simple Seed Fix] Contraseña hasheada para ${user.email}`);

        // Prepare user data
        const userData = {
          uid: user.uid,
          email: user.email,
          password: hashedPassword,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phone: user.phone,
          role: user.role,
          status: user.status,
          storeId: user.storeId,
          storeRequest: user.storeRequest || false,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Upsert user
        const result = await usersCollection.replaceOne(
          { email: user.email },
          userData,
          { upsert: true }
        );

        console.log(`✅ [Simple Seed Fix] Usuario ${user.email}: ${result.upsertedCount > 0 ? 'creado' : 'actualizado'}`);
        
        results.push({
          email: user.email,
          success: true,
          action: result.upsertedCount > 0 ? 'created' : 'updated',
          originalPassword: user.password
        });

      } catch (userError) {
        console.error(`❌ [Simple Seed Fix] Error con ${user.email}:`, userError);
        results.push({
          email: user.email,
          success: false,
          error: userError.message
        });
      }
    }

    // Verificar resultado final
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithPassword = await usersCollection.countDocuments({ 
      password: { $exists: true, $ne: null, $ne: '' } 
    });

    console.log('🎉 [Simple Seed Fix] Proceso completado');

    return NextResponse.json({
      success: true,
      message: 'Arreglo simple de usuarios completado',
      results,
      finalStats: {
        totalUsers,
        usersWithPassword,
        usersWithoutPassword: totalUsers - usersWithPassword
      },
      credentials: results.filter(r => r.success).map(r => ({
        email: r.email,
        password: r.originalPassword,
        status: r.action
      }))
    });

  } catch (error: any) {
    console.error('❌ [Simple Seed Fix] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en arreglo simple',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}