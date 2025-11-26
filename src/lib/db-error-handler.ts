// src/lib/db-error-handler.ts
import { NextResponse } from 'next/server';

export interface DatabaseError {
  code?: string | number;
  name: string;
  message: string;
  keyPattern?: Record<string, any>;
  keyValue?: Record<string, any>;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string | number;
  timestamp: string;
}

export function handleDatabaseError(error: any, operation: string = 'database operation'): NextResponse {
  console.error(`❌ [${operation}] Database error:`, {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });

  const timestamp = new Date().toISOString();
  let response: ErrorResponse;
  let statusCode = 500;

  // Handle specific MongoDB/Mongoose errors
  switch (error.name) {
    case 'ValidationError':
      response = {
        error: 'Datos de entrada inválidos',
        details: Object.values(error.errors).map((err: any) => err.message).join(', '),
        code: 'VALIDATION_ERROR',
        timestamp
      };
      statusCode = 400;
      break;

    case 'CastError':
      response = {
        error: 'Formato de ID inválido',
        details: `El valor "${error.value}" no es un ID válido`,
        code: 'INVALID_ID',
        timestamp
      };
      statusCode = 400;
      break;

    case 'MongoServerError':
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern || {})[0] || 'campo';
        const value = Object.values(error.keyValue || {})[0] || 'valor';
        response = {
          error: 'Registro duplicado',
          details: `Ya existe un registro con ${field}: "${value}"`,
          code: 'DUPLICATE_KEY',
          timestamp
        };
        statusCode = 409;
      } else {
        response = {
          error: 'Error del servidor de base de datos',
          details: error.message,
          code: error.code,
          timestamp
        };
      }
      break;

    case 'MongooseServerSelectionError':
      response = {
        error: 'No se puede conectar a la base de datos',
        details: 'El servidor de base de datos no está disponible',
        code: 'CONNECTION_ERROR',
        timestamp
      };
      statusCode = 503;
      break;

    case 'MongoNetworkError':
      response = {
        error: 'Error de red con la base de datos',
        details: 'Problema de conectividad de red',
        code: 'NETWORK_ERROR',
        timestamp
      };
      statusCode = 503;
      break;

    case 'MongoTimeoutError':
      response = {
        error: 'Tiempo de espera agotado',
        details: 'La operación tardó demasiado en completarse',
        code: 'TIMEOUT_ERROR',
        timestamp
      };
      statusCode = 504;
      break;

    default:
      // Generic error handling
      response = {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Ha ocurrido un error inesperado',
        code: 'INTERNAL_ERROR',
        timestamp
      };
  }

  return NextResponse.json(response, { status: statusCode });
}

export function validateRequiredFields(data: any, requiredFields: string[]): string | null {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return `Campos requeridos faltantes: ${missingFields.join(', ')}`;
  }
  
  return null;
}

export function logDatabaseOperation(operation: string, collection: string, data?: any): void {
  console.log(`📝 [${operation}] ${collection}:`, {
    timestamp: new Date().toISOString(),
    operation,
    collection,
    dataKeys: data ? Object.keys(data) : undefined
  });
}

export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | NextResponse> {
  try {
    const result = await operation();
    logDatabaseOperation(operationName, 'success');
    return result;
  } catch (error) {
    return handleDatabaseError(error, operationName);
  }
}