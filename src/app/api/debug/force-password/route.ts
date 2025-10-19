// src/app/api/debug/force-password/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('✅ [Force Password] Conectado a MongoDB');

    // Use direct MongoDB operations instead of Mongoose model
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find the demo user
    const demoUser = await usersCollection.findOne({ email: 'demo@tiendafacil.com' });
    
    if (!demoUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario demo no encontrado'
      });
    }

    console.log('👤 [Force Password] Usuario encontrado:', demoUser.email);
    console.log('🔍 [Force Password] Campos actuales:', Object.keys(demoUser));

    // Hash the password
    const hashedPassword = await bcrypt.hash('user1234', 10);
    console.log('🔒 [Force Password] Contraseña hasheada:', hashedPassword.substring(0, 20) + '...');

    // Force update using direct MongoDB operation
    const updateResult = await usersCollection.updateOne(
      { email: 'demo@tiendafacil.com' },
      { 
        $set: { 
          password: hashedPassword,
          uid: 'user_demo_001',
          role: 'admin',
          status: 'active',
          storeId: 'store_clifp94l0000008l3b1z9f8j7'
        } 
      }
    );

    console.log('📝 [Force Password] Resultado de actualización:', updateResult);

    // Verify the update
    const updatedUser = await usersCollection.findOne({ email: 'demo@tiendafacil.com' });
    console.log('✅ [Force Password] Usuario después de actualización:', Object.keys(updatedUser));
    console.log('🔍 [Force Password] Tiene contraseña:', !!updatedUser.password);

    return NextResponse.json({
      success: true,
      message: 'Contraseña forzada exitosamente',
      updateResult: {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      },
      user: {
        email: updatedUser.email,
        hasPassword: !!updatedUser.password,
        passwordLength: updatedUser.password ? updatedUser.password.length : 0,
        fields: Object.keys(updatedUser)
      },
      credentials: {
        email: 'demo@tiendafacil.com',
        password: 'user1234'
      }
    });

  } catch (error: any) {
    console.error('❌ [Force Password] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error forzando contraseña',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}