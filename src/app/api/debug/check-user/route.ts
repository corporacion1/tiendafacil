// src/app/api/debug/check-user/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    
    const demoUser = await User.findOne({ email: 'demo@tiendafacil.com' });
    
    if (!demoUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario demo no encontrado'
      });
    }

    // Get the raw document to see all fields
    const rawUser = demoUser.toObject();
    
    return NextResponse.json({
      success: true,
      user: {
        _id: rawUser._id,
        email: rawUser.email,
        uid: rawUser.uid,
        role: rawUser.role,
        status: rawUser.status,
        storeId: rawUser.storeId,
        hasPassword: !!rawUser.password,
        passwordLength: rawUser.password ? rawUser.password.length : 0,
        passwordPreview: rawUser.password ? rawUser.password.substring(0, 10) + '...' : null,
        allFields: Object.keys(rawUser)
      }
    });

  } catch (error: any) {
    console.error('❌ [Check User] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}