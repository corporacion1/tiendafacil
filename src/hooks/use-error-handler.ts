// src/hooks/use-error-handler.ts
import { useCallback } from 'react';
import { 
  errorHandler, 
  ErrorContext, 
  handleApiError,
  handleNetworkError,
  handleValidationError,
  handleAuthError,
  handleBusinessLogicError,
  handleUnknownError
} from '@/services/ErrorHandler';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/settings-context';

export const useErrorHandler = () => {
  const { user } = useAuth();
  const { activeStoreId } = useSettings();

  // Crear contexto base con información del usuario y tienda
  const createBaseContext = useCallback((additionalContext?: Partial<ErrorContext>): ErrorContext => {
    return {
      userId: user?.id,
      storeId: activeStoreId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      ...additionalContext
    };
  }, [user?.id, activeStoreId]);

  // Wrapper functions con contexto automático
  const handleError = {
    api: useCallback((error: any, context?: Partial<ErrorContext>) => {
      handleApiError(error, createBaseContext(context));
    }, [createBaseContext]),

    network: useCallback((error: any, context?: Partial<ErrorContext>) => {
      handleNetworkError(error, createBaseContext(context));
    }, [createBaseContext]),

    validation: useCallback((errors: string[] | string, context?: Partial<ErrorContext>) => {
      handleValidationError(errors, createBaseContext(context));
    }, [createBaseContext]),

    auth: useCallback((error: any, context?: Partial<ErrorContext>) => {
      handleAuthError(error, createBaseContext(context));
    }, [createBaseContext]),

    businessLogic: useCallback((message: string, context?: Partial<ErrorContext>) => {
      handleBusinessLogicError(message, createBaseContext(context));
    }, [createBaseContext]),

    unknown: useCallback((error: any, context?: Partial<ErrorContext>) => {
      handleUnknownError(error, createBaseContext(context));
    }, [createBaseContext])
  };

  // Función para manejar errores de fetch con retry automático
  const handleFetchError = useCallback(async (
    fetchFn: () => Promise<Response>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      context?: Partial<ErrorContext>;
    } = {}
  ): Promise<Response> => {
    const { maxRetries = 2, retryDelay = 1000, context } = options;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchFn();
        
        if (!response.ok) {
          // Intentar parsear el error del servidor
          let errorData: any;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText, status: response.status };
          }
          
          // Si es el último intento o un error que no debe reintentarse
          if (attempt === maxRetries || response.status < 500) {
            handleError.api(errorData, { ...context, action: 'fetch_request' });
            throw errorData;
          }
          
          lastError = errorData;
        } else {
          return response;
        }
      } catch (error) {
        lastError = error;
        
        // Si es un error de red y no es el último intento, reintentar
        if (attempt < maxRetries && (
          error instanceof TypeError || 
          error.name === 'NetworkError' ||
          error.message?.includes('fetch')
        )) {
          console.log(`🔄 Reintentando solicitud (${attempt + 1}/${maxRetries + 1})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        
        // Manejar el error según su tipo
        if (error instanceof TypeError || error.name === 'NetworkError') {
          handleError.network(error, { ...context, action: 'fetch_request' });
        } else {
          handleError.api(error, { ...context, action: 'fetch_request' });
        }
        
        throw error;
      }
    }

    throw lastError;
  }, [handleError]);

  // Función wrapper para operaciones async con manejo de errores
  const withErrorHandling = useCallback(<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> => {
    return operation().catch((error) => {
      // Determinar el tipo de error y manejarlo apropiadamente
      if (error.status || error.response) {
        handleError.api(error, context);
      } else if (error instanceof TypeError || error.name === 'NetworkError') {
        handleError.network(error, context);
      } else {
        handleError.unknown(error, context);
      }
      throw error;
    });
  }, [handleError]);

  return {
    handleError,
    handleFetchError,
    withErrorHandling,
    getErrorLog: errorHandler.getErrorLog.bind(errorHandler),
    getErrorStats: errorHandler.getErrorStats.bind(errorHandler),
    clearErrorLog: errorHandler.clearErrorLog.bind(errorHandler)
  };
};