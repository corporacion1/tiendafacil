import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

// GET /api/stores-admin - Fetch all stores with administrative data
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('🏪 [Stores Admin API] Fetching stores with params:', { page, limit, search, status, sortBy, sortOrder });

    // Build filter query
    let filterQuery: any = {};
    
    // Status filter
    if (status !== 'all') {
      if (status === 'production') {
        filterQuery.useDemoData = false;
      } else {
        filterQuery.status = status;
      }
    }

    // Search filter (store name or admin name)
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'ownerIds': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort query
    let sortQuery: any = {};
    if (sortBy === 'name') {
      sortQuery.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sortQuery.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Get stores with pagination
    const skip = (page - 1) * limit;
    const stores = await Store.find(filterQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalStores = await Store.countDocuments(filterQuery);

    // Enrich stores with additional data
    const enrichedStores = await Promise.all(
      stores.map(async (store) => {
        // Get user count for this store
        const userCount = await User.countDocuments({ storeId: store.storeId });
        
        // Get admin information
        let adminName = 'Sin administrador';
        let adminContact = '';
        
        if (store.ownerIds && store.ownerIds.length > 0) {
          const admin = await User.findOne({ uid: store.ownerIds[0] }).lean();
          const adminData = Array.isArray(admin) ? admin[0] : admin;
          if (adminData) {
            adminName = adminData.displayName || adminData.email || 'Administrador';
            adminContact = adminData.phone || '';
          }
        }

        // Determine if store is in production
        const isProduction = !store.useDemoData;

        return {
          ...store,
          userCount,
          adminName,
          adminContact,
          isProduction,
          lastActivity: store.updatedAt || store.createdAt,
        };
      })
    );

    // Calculate statistics
    const allStores = await Store.find({}).lean();
    const statistics = {
      total: allStores.length,
      active: allStores.filter(s => s.status === 'active').length,
      inactive: allStores.filter(s => s.status === 'inactive').length,
      production: allStores.filter(s => !s.useDemoData).length,
    };

    const response = {
      stores: enrichedStores,
      statistics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalStores / limit),
        total: totalStores,
      },
    };

    console.log('✅ [Stores Admin API] Successfully fetched', enrichedStores.length, 'stores');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [Stores Admin API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tiendas' },
      { status: 500 }
    );
  }
}