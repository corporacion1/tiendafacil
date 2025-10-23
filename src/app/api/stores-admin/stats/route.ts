import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

// GET /api/stores-admin/stats - Get dashboard statistics
export async function GET() {
  try {
    await connectToDatabase();
    
    console.log('📊 [Stores Admin Stats API] Fetching dashboard statistics');

    // Get all stores
    const allStores = await Store.find({}).lean();
    
    // Calculate basic statistics
    const statistics = {
      total: allStores.length,
      active: allStores.filter(s => s.status === 'active').length,
      inactive: allStores.filter(s => s.status === 'inactive').length,
      production: allStores.filter(s => !s.useDemoData).length,
    };

    // Get recent activity (stores created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStores = await Store.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(3).lean();

    // Enrich recent stores with admin info
    const recentActivity = await Promise.all(
      recentStores.map(async (store) => {
        let adminName = 'Sin administrador';
        
        if (store.ownerIds && store.ownerIds.length > 0) {
          const admin = await User.findOne({ uid: store.ownerIds[0] }).lean();
          const adminData = Array.isArray(admin) ? admin[0] : admin;
          if (adminData) {
            adminName = adminData.displayName || adminData.email || 'Administrador';
          }
        }

        // Determinar el status correcto basado en useDemoData y status
        let displayStatus = 'active';
        if (store.status === 'inactive') {
          displayStatus = 'inactive';
        } else if (!store.useDemoData) {
          displayStatus = 'production';
        }

        return {
          storeId: store.storeId,
          storeName: store.name,
          adminName,
          createdAt: store.createdAt,
          status: displayStatus,
          isProduction: !store.useDemoData,
        };
      })
    );

    // Get total users across all stores
    const totalUsers = await User.countDocuments({});

    const response = {
      ...statistics,
      totalUsers,
      recentActivity,
      lastUpdated: new Date().toISOString(),
    };

    console.log('✅ [Stores Admin Stats API] Statistics calculated:', statistics);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [Stores Admin Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las estadísticas' },
      { status: 500 }
    );
  }
}