// src/lib/mongodb.ts
import mongoose from 'mongoose';

// MongoDB connection configuration removed during migration to Supabase

interface ConnectionStatus {
  isConnected: boolean;
  host?: string;
  database?: string;
  lastConnected?: Date;
  attempts: number;
}

let connectionStatus: ConnectionStatus = {
  isConnected: false,
  attempts: 0
};

export function getConnectionStatus(): ConnectionStatus {
  return { ...connectionStatus };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// MongoDB connection logic removed during migration to Supabase

// MongoDB event listeners removed during migration to Supabase

export async function retryConnection(maxRetries: number = MAX_RETRY_ATTEMPTS): Promise<boolean> {
  console.log(`� [retryConnection] Intentando reconectar (máximo ${maxRetries} intentos)...`);
  
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await connectToDatabase();
      return true;
    } catch (error) {
      console.error(`❌ [retryConnection] Intento ${i}/${maxRetries} falló:`, error);
      if (i < maxRetries) {
        await delay(RETRY_DELAY * i); // Exponential backoff
      }
    }
  }
  
  return false;
}

export async function healthCheck(): Promise<{ status: string; details: ConnectionStatus }> {
  try {
    if (mongoose.connection.readyState === 1) {
      // Test the connection with a simple operation
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      return {
        status: 'healthy',
        details: getConnectionStatus()
      };
    } else {
      return {
        status: 'disconnected',
        details: getConnectionStatus()
      };
    }
  } catch (error) {
    return {
      status: 'error',
      details: { 
        ...getConnectionStatus(), 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } as any
    };
  }
}
