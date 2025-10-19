// src/app/api/debug/test-login/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { email, password } = await request.json();
    console.log('🧪 [Test Login] Testing login for:', email);
    console.log('🧪 [Test Login] Password provided:', password);

    // Use direct MongoDB operations
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find the user
    const user = await usersCollection.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado',
        step: 'USER_NOT_FOUND'
      });
    }

    console.log('👤 [Test Login] Usuario encontrado:', user.email);
    console.log('🔍 [Test Login] Usuario tiene contraseña:', !!user.password);
    console.log('🔍 [Test Login] Longitud de contraseña:', user.password ? user.password.length : 0);
    console.log('🔍 [Test Login] Contraseña preview:', user.password ? user.password.substring(0, 20) + '...' : 'null');

    if (!user.password) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no tiene contraseña configurada',
        step: 'NO_PASSWORD'
      });
    }

    // Test bcrypt comparison
    console.log('🔒 [Test Login] Comparando contraseñas...');
    console.log('🔒 [Test Login] Contraseña plana:', password);
    console.log('🔒 [Test Login] Hash almacenado:', user.password);

    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log('✅ [Test Login] Resultado de comparación:', isMatch);
    } catch (bcryptError) {
      console.error('❌ [Test Login] Error en bcrypt.compare:', bcryptError);
      return NextResponse.json({
        success: false,
        message: 'Error al verificar contraseña',
        step: 'BCRYPT_ERROR',
        error: bcryptError.message
      });
    }

    if (!isMatch) {
      // Let's try to create a new hash and compare
      console.log('🔄 [Test Login] Contraseña no coincide, creando nuevo hash para comparar...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('🔄 [Test Login] Nuevo hash:', newHash);
      
      return NextResponse.json({
        success: false,
        message: 'Contraseña incorrecta',
        step: 'PASSWORD_MISMATCH',
        debug: {
          providedPassword: password,
          storedHashPreview: user.password.substring(0, 20) + '...',
          newHashPreview: newHash.substring(0, 20) + '...'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      step: 'SUCCESS',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        storeId: user.storeId
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Login] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno',
        step: 'INTERNAL_ERROR',
        error: error.message
      },
      { status: 500 }
    );
  }
}