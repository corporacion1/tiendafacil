// src/app/api/auth/debug/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    console.log('✅ Conectado a MongoDB');
    
    const userCount = await User.countDocuments();
    console.log(`📊 Usuarios en DB: ${userCount}`);
    
    const users = await User.find({}).limit(3);
    console.log('👥 Primeros usuarios:', users.map(u => ({
      email: u.email,
      id: u._id.toString()
    })));
    
    return NextResponse.json({
      connected: true,
      userCount,
      users: users.map(u => ({
        email: u.email,
        id: u._id.toString(),
        phone: u.phone
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Error en debug:', error);
    return NextResponse.json({
      connected: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}