import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

// GET /api/stores-admin/[storeId] - Get detailed store information
export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    await connectToDatabase();
    
    const { storeId } = params;
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 [Stores Admin Detail API] Fetching store details for:', storeId);

    // Find the store
    const store = await Store.findOne({ storeId }).lean();
    
    if (!store) {
      console.error('❌ [Stores Admin Detail API] Store not found:', storeId);
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Get all users associated with this store
    const storeUsers = await User.find({ storeId }).lean();
    
    // Get admin information
    let adminInfo = null;
    if (store.ownerIds && store.ownerIds.length > 0) {
      const admin = await User.findOne({ uid: store.ownerIds[0] }).lean();
      if (admin) {
        adminInfo = {
          uid: admin.uid,
          email: admin.email,
          displayName: admin.displayName,
          phone: admin.phone,
          role: admin.role,
          createdAt: admin.createdAt
        };
      }
    }

    // Process user roles from store.userRoles
    const userRoles = store.userRoles || [];
    const enrichedUserRoles = await Promise.all(
      userRoles.map(async (userRole) => {
        const user = await User.findOne({ uid: userRole.uid }).lean();
        return {
          uid: userRole.uid,
          role: userRole.role,
          userInfo: user ? {
            email: user.email,
            displayName: user.displayName,
            phone: user.phone,
            status: user.status,
            createdAt: user.createdAt
          } : null
        };
      })
    );

    // Calculate store statistics
    const userCount = storeUsers.length;
    const activeUsers = storeUsers.filter(u => u.status === 'active').length;
    const usersByRole = storeUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine if store is in production
    const isProduction = !store.useDemoData;

    const detailedStore = {
      // Basic store information
      ...store,
      
      // Admin information
      adminInfo,
      
      // User statistics
      userCount,
      activeUsers,
      usersByRole,
      
      // User roles with details
      userRoles: enrichedUserRoles,
      
      // Production status
      isProduction,
      
      // Activity information
      lastActivity: store.updatedAt || store.createdAt,
      
      // Configuration summary
      configuration: {
        primaryCurrency: {
          name: store.primaryCurrencyName,
          symbol: store.primaryCurrencySymbol
        },
        secondaryCurrency: {
          name: store.secondaryCurrencyName,
          symbol: store.secondaryCurrencySymbol
        },
        taxes: {
          tax1: store.tax1,
          tax2: store.tax2
        },
        business: {
          type: store.businessType,
          address: store.address,
          phone: store.phone,
          whatsapp: store.whatsapp,
          tiktok: store.tiktok
        }
      }
    };

    console.log('✅ [Stores Admin Detail API] Store details fetched successfully');
    return NextResponse.json(detailedStore);

  } catch (error) {
    console.error('❌ [Stores Admin Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los detalles de la tienda' },
      { status: 500 }
    );
  }
}