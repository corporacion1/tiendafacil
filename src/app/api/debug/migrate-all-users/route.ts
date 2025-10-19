// src/app/api/debug/migrate-all-users/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const SALT_ROUNDS = 10;

// Default passwords for different users
const userPasswords = {
  'demo@tiendafacil.com': 'user1234',
  'admin@tiendafacil.com': 'admin1234',
  'user@tiendafacil.com': 'user1234',
  'test@tiendafacil.com': 'test1234',
  'default': 'tiendafacil123' // Default password for any other user
};

export async function POST() {
  try {
    console.log('🚀 [Migrate All Users] Iniciando migración completa de usuarios...');
    
    await connectToDatabase();
    console.log('🔌 [Migrate All Users] Conectado a MongoDB');

    // Use direct MongoDB operations
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`📊 [Migrate All Users] Encontrados ${allUsers.length} usuarios`);

    let updatedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    const results = [];

    for (const user of allUsers) {
      try {
        const email = user.email;
        console.log(`👤 [Migrate All Users] Procesando usuario: ${email}`);

        // Check if user already has a password
        if (user.password && user.password.length > 0) {
          console.log(`⏭️ [Migrate All Users] Usuario ${email} ya tiene contraseña, saltando...`);
          skippedCount++;
          results.push({
            email,
            action: 'skipped',
            reason: 'already_has_password'
          });
          continue;
        }

        // Determine password for this user
        const plainPassword = userPasswords[email] || userPasswords.default;
        console.log(`🔒 [Migrate All Users] Asignando contraseña a ${email}: ${plainPassword}`);

        // Hash the password
        const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

        // Update user with password and ensure all required fields
        const updateData = {
          password: hashedPassword,
          uid: user.uid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '/tienda_facil_logo.svg',
          role: user.role || 'user',
          status: user.status || 'active',
          storeId: user.storeId || 'store_clifp94l0000008l3b1z9f8j7',
          storeRequest: user.storeRequest || false,
          phone: user.phone || null
        };

        const updateResult = await usersCollection.updateOne(
          { _id: user._id },
          { $set: updateData }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(`✅ [Migrate All Users] Usuario ${email} actualizado exitosamente`);
          updatedCount++;
          results.push({
            email,
            action: 'updated',
            password: plainPassword,
            role: updateData.role
          });
        } else {
          console.log(`⚠️ [Migrate All Users] Usuario ${email} no se pudo actualizar`);
          results.push({
            email,
            action: 'failed',
            reason: 'update_failed'
          });
        }

      } catch (userError: any) {
        console.error(`❌ [Migrate All Users] Error procesando usuario ${user.email}:`, userError);
        results.push({
          email: user.email,
          action: 'error',
          error: userError.message
        });
      }
    }

    // Create additional demo users if they don't exist
    const demoUsers = [
      {
        uid: 'admin_demo_001',
        email: 'admin@tiendafacil.com',
        displayName: 'Admin Demo',
        role: 'admin',
        password: 'admin1234'
      },
      {
        uid: 'user_demo_002',
        email: 'user@tiendafacil.com',
        displayName: 'User Demo',
        role: 'user',
        password: 'user1234'
      }
    ];

    for (const demoUser of demoUsers) {
      const existingUser = await usersCollection.findOne({ email: demoUser.email });
      
      if (!existingUser) {
        console.log(`👤 [Migrate All Users] Creando usuario demo: ${demoUser.email}`);
        
        const hashedPassword = await bcrypt.hash(demoUser.password, SALT_ROUNDS);
        
        const newUser = {
          uid: demoUser.uid,
          email: demoUser.email,
          password: hashedPassword,
          displayName: demoUser.displayName,
          photoURL: '/tienda_facil_logo.svg',
          role: demoUser.role,
          status: 'active',
          storeId: 'store_clifp94l0000008l3b1z9f8j7',
          storeRequest: false,
          phone: null,
          createdAt: new Date().toISOString()
        };

        await usersCollection.insertOne(newUser);
        createdCount++;
        results.push({
          email: demoUser.email,
          action: 'created',
          password: demoUser.password,
          role: demoUser.role
        });
        
        console.log(`✅ [Migrate All Users] Usuario demo creado: ${demoUser.email}`);
      }
    }

    // Final verification
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithPassword = await usersCollection.countDocuments({ 
      password: { $exists: true, $ne: null, $ne: '' } 
    });

    const summary = {
      totalProcessed: allUsers.length,
      updated: updatedCount,
      skipped: skippedCount,
      created: createdCount,
      errors: results.filter(r => r.action === 'error').length,
      finalStats: {
        totalUsers,
        usersWithPassword,
        usersWithoutPassword: totalUsers - usersWithPassword
      }
    };

    console.log('📋 [Migrate All Users] Resumen final:', summary);

    return NextResponse.json({
      success: true,
      message: 'Migración de todos los usuarios completada',
      summary,
      userCredentials: results.filter(r => r.action === 'updated' || r.action === 'created').map(r => ({
        email: r.email,
        password: r.password,
        role: r.role
      })),
      allResults: results
    });

  } catch (error: any) {
    console.error('❌ [Migrate All Users] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en migración de usuarios',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithPassword = await usersCollection.countDocuments({ 
      password: { $exists: true, $ne: null, $ne: '' } 
    });
    
    // Get all users (without passwords for security)
    const users = await usersCollection.find({}, { 
      projection: { password: 0 } 
    }).toArray();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        usersWithPassword,
        usersWithoutPassword: totalUsers - usersWithPassword
      },
      users: users.map(user => ({
        email: user.email,
        role: user.role,
        status: user.status,
        hasPassword: !!user.password,
        storeId: user.storeId
      })),
      availableCredentials: [
        { email: 'demo@tiendafacil.com', password: 'user1234', role: 'admin' },
        { email: 'admin@tiendafacil.com', password: 'admin1234', role: 'admin' },
        { email: 'user@tiendafacil.com', password: 'user1234', role: 'user' },
        { email: 'otros usuarios', password: 'tiendafacil123', role: 'variable' }
      ]
    });

  } catch (error: any) {
    console.error('❌ [Migrate All Users] Error getting status:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error obteniendo estado de usuarios',
        error: error.message 
      },
      { status: 500 }
    );
  }
}