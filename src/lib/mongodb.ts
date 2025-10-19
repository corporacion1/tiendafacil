// src/lib/mongodb.ts
import mongoose from 'mongoose';

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

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

export async function connectToDatabase(): Promise<mongoose.Connection> {
  console.log('🔌 [connectToDatabase] Iniciando conexión...');

  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('🟢 [connectToDatabase] Ya conectado. Reutilizando conexión.');
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    const errorMsg = 'MONGO_URI no está definida en las variables de entorno';
    console.error('❌ [connectToDatabase] FATAL:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log('📡 [connectToDatabase] URI usada:', process.env.MONGO_URI.replace(/\/\/(.*?)@/, '//***:***@'));

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'tiendafacil',
    });

    isConnected = conn.connections[0].readyState === 1;

    if (isConnected) {
      connectionStatus = {
        isConnected: true,
        host: conn.connection.host,
        database: conn.connection.name,
        lastConnected: new Date(),
        attempts: connectionAttempts
      };
      
      console.log(`🚀 [connectToDatabase] ¡Conexión exitosa!`);
      console.log(`   Host: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      
      // Reset connection attempts on successful connection
      connectionAttempts = 0;
      
      return conn.connection;
    } else {
      throw new Error('Conexión establecida pero no está en estado "ready"');
    }

  } catch (error: any) {
    console.error('❌ [connectToDatabase] ERROR al conectar con MongoDB:');
    console.error('   Mensaje:', error.message);
    console.error('   Nombre del error:', error.name);

    if (error.name === 'MongoParseError') {
      console.error('\n💡 PROBABLE CAUSA: URI de MongoDB malformada');
      console.error('👉 Solución: Verifica que la URI tenga el formato correcto');
    }

    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 PROBABLE CAUSA: No se puede conectar al servidor MongoDB');
      console.error('👉 Solución: Verifica que MongoDB Atlas esté accesible');
    }

    connectionStatus.isConnected = false;
    throw new Error(`No se pudo conectar a la base de datos: ${error.message}`);
  }
}

function setupConnectionListeners(): void {
  mongoose.connection.on('connected', () => {
    console.log('🟢 [MongoDB] Conexión establecida');
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ [MongoDB] Error de conexión:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [MongoDB] Conexión perdida');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 [MongoDB] Reconectado exitosamente');
    isConnected = true;
  });
}

export async function retryConnection(maxRetries: number = MAX_RETRY_ATTEMPTS): Promise<boolean> {
  console.log(`🔄 [retryConnection] Intentando reconectar (máximo ${maxRetries} intentos)...`);
  
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
      await mongoose.connection.db.admin().ping();
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
      details: { ...getConnectionStatus(), error: error.message }
    };
  }
}