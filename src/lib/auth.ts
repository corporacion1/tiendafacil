// src/lib/auth.ts
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function compareEncrypted(input: string, stored: string): boolean {
  // Simple comparison for encrypted values
  return input === stored;
}

export async function getSession(request?: Request) {
  try {
    // Para desarrollo, devolvemos una sesión mock
    // En producción, esto debería validar JWT tokens o cookies
    return {
      user: {
        id: '5QLaiiIr4mcGsjRXVGeGx50nrpk1', // ID del usuario demo
        email: 'corporacion1@gmail.com',
        name: 'Jorge Negrete'
      }
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// NUEVAS FUNCIONES PARA EL SISTEMA DE AUTH
export function getAuthUser() {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

export function requireAuth() {
  const user = getAuthUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function requireRole(requiredRole: string) {
  const user = requireAuth();
  if (user.role !== requiredRole) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }
  return user;
}

export function requireStoreAccess(storeId: string) {
  const user = requireAuth();
  if (user.storeId !== storeId && user.role !== 'su') {
    throw new Error(`Access denied for store: ${storeId}`);
  }
  return user;
}