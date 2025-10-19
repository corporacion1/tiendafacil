// src/app/api/debug/users/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all users but exclude password field for security
    const users = await User.find({}, { password: 0 }).limit(10);
    
    // Get count of users with and without passwords
    const totalUsers = await User.countDocuments({});
    const usersWithPassword = await User.countDocuments({ password: { $exists: true, $ne: null } });
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        withPassword: usersWithPassword,
        withoutPassword: totalUsers - usersWithPassword
      },
      users: users.map(user => ({
        id: user._id,
        uid: user.uid,
        email: user.email,
        role: user.role,
        status: user.status,
        hasPassword: !!user.password,
        createdAt: user.createdAt
      }))
    });

  } catch (error: any) {
    console.error('❌ [Debug Users] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error obteniendo información de usuarios',
        error: error.message 
      },
      { status: 500 }
    );
  }
}