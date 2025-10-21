import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

// GET /api/stores-admin/[storeId] - Get detailed store information
export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { storeId } = await params;
    
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
    const storeData = Array.isArray(store) ? store[0] : store;
    if (storeData && storeData.ownerIds && storeData.ownerIds.length > 0) {
      const admin = await User.findOne({ uid: storeData.ownerIds[0] }).lean();
      const adminData = Array.isArray(admin) ? admin[0] : admin;
      if (adminData) {
        adminInfo = {
          uid: adminData.uid,
          email: adminData.email,
          displayName: adminData.displayName,
          phone: adminData.phone,
          role: adminData.role,
          createdAt: adminData.createdAt
        };
      }
    }

    // Process user roles from store.userRoles
    const userRoles = storeData?.userRoles || [];
    const enrichedUserRoles = await Promise.all(
      userRoles.map(async (userRole: any) => {
        const user = await User.findOne({ uid: userRole.uid }).lean();
        const userData = Array.isArray(user) ? user[0] : user;
        return {
          uid: userRole.uid,
          role: userRole.role,
          userInfo: userData ? {
            email: userData.email,
            displayName: userData.displayName,
            phone: userData.phone,
            status: userData.status,
            createdAt: userData.createdAt
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
    const isProduction = !storeData?.useDemoData;

    const detailedStore = {
      // Basic store information
      ...storeData,
      
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
      lastActivity: storeData?.updatedAt || storeData?.createdAt,
      
      // Configuration summary
      configuration: {
        primaryCurrency: {
          name: storeData?.primaryCurrencyName,
          symbol: storeData?.primaryCurrencySymbol
        },
        secondaryCurrency: {
          name: storeData?.secondaryCurrencyName,
          symbol: storeData?.secondaryCurrencySymbol
        },
        taxes: {
          tax1: storeData?.tax1,
          tax2: storeData?.tax2
        },
        business: {
          type: storeData?.businessType,
          address: storeData?.address,
          phone: storeData?.phone,
          whatsapp: storeData?.whatsapp,
          tiktok: storeData?.tiktok
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