// pages/api/stores-admin/[storeId]/users.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeId } = req.query;

  try {
    // Obtener usuarios con roles en esta tienda
    const { data: userRoles, error } = await supabaseAdmin
      .from('users')
      .select(`
          uid,
          email,
          display_name,
          phone,
          status,
          role,
          created_at
      `)
      .eq('store_id', storeId);

    console.log('User roles:', userRoles);

    if (error) {
      console.error('Error fetching user roles:', error);
      return res.status(500).json({ error: error.message });
    }

    // Transformar los datos
    const users = userRoles.map((role : any) => ({
      uid: role.user_id,
      ...role.users,
      role: role.role
    }));

    return res.status(200).json({ users });
  } catch (err) {
    console.error('Error in users endpoint:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}