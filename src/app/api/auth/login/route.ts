// src/app/api/auth/login/route.ts - VERIFICAR que tenga esto
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // Attempt database connection with proper error handling
    try {
      await connectToDatabase();
    } catch (dbError: any) {
      console.error('❌ [Login API] Error de conexión a la base de datos:', dbError);
      return NextResponse.json(
        { 
          success: false,
          msg: 'Error de conexión a la base de datos. Inténtalo más tarde.',
          error: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    let email: string, password: string;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (parseError) {
      console.error('❌ [Login API] Error parsing request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          msg: 'Formato de datos inválido',
          error: 'INVALID_REQUEST_FORMAT'
        },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          msg: 'Email y contraseña son requeridos',
          error: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    // Find user with proper error handling using direct MongoDB operations
    let user;
    try {
      // Use direct MongoDB operations instead of Mongoose model
      const mongoose = await import('mongoose');
      const db = mongoose.default.connection.db;
      
      if (!db) {
        throw new Error('Database connection not established');
      }
      
      const usersCollection = db.collection('users');
      
      user = await usersCollection.findOne({ email: email.toLowerCase().trim() });
      console.log('👤 [Login API] Usuario encontrado:', user ? user.email : 'null');
      console.log('🔍 [Login API] Usuario tiene contraseña:', user ? !!user.password : false);
    } catch (dbQueryError: any) {
      console.error('❌ [Login API] Error consultando usuario:', dbQueryError);
      return NextResponse.json(
        { 
          success: false,
          msg: 'Error al consultar la base de datos',
          error: 'DATABASE_QUERY_ERROR'
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          msg: 'Credenciales incorrectas',
          error: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Verify password with proper error handling
    let isMatch: boolean;
    try {
      console.log('🔒 [Login API] Verificando contraseña para:', user.email);
      console.log('🔒 [Login API] Contraseña proporcionada:', password);
      console.log('🔒 [Login API] Hash almacenado preview:', user.password ? user.password.substring(0, 20) + '...' : 'null');
      
      isMatch = await bcrypt.compare(password, user.password);
      console.log('✅ [Login API] Resultado de comparación:', isMatch);
    } catch (bcryptError: any) {
      console.error('❌ [Login API] Error verificando contraseña:', bcryptError);
      console.error('❌ [Login API] Stack trace:', bcryptError.stack);
      return NextResponse.json(
        { 
          success: false,
          msg: 'Error al verificar credenciales',
          error: 'PASSWORD_VERIFICATION_ERROR',
          details: bcryptError.message
        },
        { status: 500 }
      );
    }

    if (!isMatch) {
      return NextResponse.json(
        { 
          success: false,
          msg: 'Credenciales incorrectas',
          error: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        storeId: user.storeId
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    // Successful login
    console.log('✅ [Login API] Login exitoso para usuario:', email);
    return NextResponse.json({
      success: true,
      msg: 'Login exitoso',
      token: token,
      user: {
        id: user._id.toString(),
        uid: user.uid,
        email: user.email,
        phone: user.phone,
        storeId: user.storeId,
        role: user.role,
        displayName: user.displayName || user.email.split('@')[0],
        storeRequest: user.storeRequest || false,
        status: user.status || 'active'
      }
    });

  } catch (error: any) {
    console.error('❌ [Login API] Error inesperado:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        msg: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}