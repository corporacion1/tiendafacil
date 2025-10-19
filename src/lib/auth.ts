// src/lib/auth.ts
import bcrypt from 'bcryptjs';

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