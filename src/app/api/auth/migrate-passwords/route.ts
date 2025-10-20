// src/app/api/auth/migrate-passwords/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { defaultUsers } from '@/lib/data';

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    console.log('🔄 [Password Migration] Iniciando migración de contraseñas...');
    
    // Connect to database
    await connectToDatabase();
    console.log('🔌 [Password Migration] Conectado a MongoDB');

    // Get all users from database
    const existingUsers = await User.find({});
    console.log(`📊 [Password Migration] Encontrados ${existingUsers.length} usuarios en la DB`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const dbUser of existingUsers) {
      try {
        // Check if user already has a password
        if (dbUser.password) {
          console.log(`⏭️ [Password Migration] Usuario ${dbUser.email} ya tiene contraseña, saltando...`);
          skippedCount++;
          continue;
        }

        // Find corresponding user data with password
        const userData = defaultUsers.find(u => u.email === dbUser.email || u.uid === dbUser.uid);
        
        if (!userData || !userData.password) {
          console.log(`⚠️ [Password Migration] No se encontró contraseña para ${dbUser.email}, usando contraseña por defecto`);
          // Use default password for users without defined password
          const defaultPassword = 'tiendafacil123';
          const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
          
          await User.findByIdAndUpdate(dbUser._id, { 
            password: hashedPassword 
          });
          
          console.log(`✅ [Password Migration] Contraseña por defecto asignada a ${dbUser.email}`);
          updatedCount++;
        } else {
          // Hash the password from data file
          const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
          
          await User.findByIdAndUpdate(dbUser._id, { 
            password: hashedPassword 
          });
          
          console.log(`✅ [Password Migration] Contraseña migrada para ${dbUser.email}`);
          updatedCount++;
        }

      } catch (userError: any) {
        console.error(`❌ [Password Migration] Error procesando usuario ${dbUser.email}:`, userError);
        errorCount++;
      }
    }

    const summary = {
      total: existingUsers.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount
    };

    console.log('📋 [Password Migration] Resumen:', summary);

    return NextResponse.json({
      success: true,
      message: 'Migración de contraseñas completada',
      summary
    });

  } catch (error: any) {
    console.error('❌ [Password Migration] Error en migración:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error durante la migración de contraseñas',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    await connectToDatabase();
    
    const totalUsers = await User.countDocuments({});
    const usersWithPassword = await User.countDocuments({ password: { $exists: true, $ne: null } });
    const usersWithoutPassword = totalUsers - usersWithPassword;

    return NextResponse.json({
      success: true,
      status: {
        total: totalUsers,
        withPassword: usersWithPassword,
        withoutPassword: usersWithoutPassword,
        migrationNeeded: usersWithoutPassword > 0
      }
    });

  } catch (error: any) {
    console.error('❌ [Password Migration Check] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error verificando estado de migración',
        error: error.message 
      },
      { status: 500 }
    );
  }
}