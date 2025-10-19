// src/app/api/debug/simple-migrate/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('🔄 [Simple Migrate] Iniciando...');
    
    await connectToDatabase();
    console.log('✅ [Simple Migrate] Conectado a MongoDB');

    // Get demo user specifically
    const demoEmail = 'demo@tiendafacil.com';
    let demoUser = await User.findOne({ email: demoEmail });
    
    if (!demoUser) {
      console.log('❌ [Simple Migrate] Usuario demo no encontrado');
      return NextResponse.json({
        success: false,
        message: 'Usuario demo no encontrado. Necesitas crear usuarios primero.'
      });
    }

    console.log('👤 [Simple Migrate] Usuario demo encontrado:', demoUser.email);
    console.log('🔍 [Simple Migrate] Tiene contraseña:', !!demoUser.password);

    // Hash the password
    const hashedPassword = await bcrypt.hash('user1234', 10);
    console.log('🔒 [Simple Migrate] Contraseña hasheada generada');

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { email: demoEmail },
      { 
        $set: { 
          password: hashedPassword,
          uid: demoUser.uid || 'user_demo_001',
          role: 'admin',
          status: 'active'
        } 
      },
      { new: true }
    );

    console.log('✅ [Simple Migrate] Usuario actualizado');
    console.log('🔍 [Simple Migrate] Nueva contraseña existe:', !!updatedUser.password);

    return NextResponse.json({
      success: true,
      message: 'Usuario demo actualizado exitosamente',
      user: {
        email: updatedUser.email,
        hasPassword: !!updatedUser.password,
        role: updatedUser.role
      },
      credentials: {
        email: 'demo@tiendafacil.com',
        password: 'user1234'
      }
    });

  } catch (error: any) {
    console.error('❌ [Simple Migrate] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en migración simple',
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    
    const demoUser = await User.findOne({ email: 'demo@tiendafacil.com' });
    
    return NextResponse.json({
      success: true,
      demoUser: demoUser ? {
        email: demoUser.email,
        hasPassword: !!demoUser.password,
        role: demoUser.role,
        uid: demoUser.uid
      } : null
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}