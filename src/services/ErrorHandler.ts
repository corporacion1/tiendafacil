// src/services/ErrorHandler.ts
import { toast } from "@/hooks/use-toast";

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  API = 'api',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  storeId?: string;
  action?: string;
  component?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  additionalData?: Record<string, unknown>;
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  stack?: string;
  timestamp: string;
  resolved: boolean;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Maneja errores de API con respuestas HTTP
   */
  handleApiError(error: unknown, context?: ErrorContext): void {
    console.error('🔴 [API Error]:', error);

    let message = 'Error en el servidor';
    let severity = ErrorSeverity.MEDIUM;

    // Type guard para verificar si el error tiene propiedades esperadas
    const isApiError = (err: unknown): err is { status?: number; message?: string; error?: string } => {
      return typeof err === 'object' && err !== null;
    };

    if (isApiError(error) && error.status) {
      switch (error.status) {
        case 400:
          message = 'Datos inválidos enviados al servidor';
          severity = ErrorSeverity.LOW;
          break;
        case 401:
          message = 'Sesión expirada. Por favor, inicia sesión nuevamente';
          severity = ErrorSeverity.HIGH;
          break;
        case 403:
          message = 'No tienes permisos para realizar esta acción';
          severity = ErrorSeverity.MEDIUM;
          break;
        case 404:
          message = 'Recurso no encontrado';
          severity = ErrorSeverity.LOW;
          break;
        case 409:
          message = 'Conflicto con el estado actual del recurso';
          severity = ErrorSeverity.MEDIUM;
          break;
        case 422:
          message = 'Datos de entrada no válidos';
          severity = ErrorSeverity.LOW;
          break;
        case 429:
          message = 'Demasiadas solicitudes. Intenta nuevamente en unos momentos';
          severity = ErrorSeverity.MEDIUM;
          break;
        case 500:
          message = 'Error interno del servidor';
          severity = ErrorSeverity.HIGH;
          break;
        case 502:
        case 503:
        case 504:
          message = 'Servicio temporalmente no disponible';
          severity = ErrorSeverity.HIGH;
          break;
        default:
          message = `Error del servidor (${error.status})`;
      }
    }

    // Si hay un mensaje específico del servidor, usarlo
    if (isApiError(error)) {
      if (error.message && typeof error.message === 'string') {
        message = error.message;
      } else if (error.error && typeof error.error === 'string') {
        message = error.error;
      }
    }

    this.logError({
      type: ErrorType.API,
      severity,
      message,
      originalError: error instanceof Error ? error : new Error(String(error)),
      context
    });

    this.showUserNotification(message, severity);
  }

  /**
   * Maneja errores de red (fetch, conexión, etc.)
   */
  handleNetworkError(error: unknown, context?: ErrorContext): void {
    console.error('🌐 [Network Error]:', error);

    let message = 'Error de conexión';
    let severity = ErrorSeverity.MEDIUM;

    // Type guard para errores de red
    const isNetworkError = (err: unknown): err is { name?: string; message?: string; code?: string } => {
      return typeof err === 'object' && err !== null;
    };

    if (isNetworkError(error)) {
      if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        message = 'No se pudo conectar al servidor. Verifica tu conexión a internet';
        severity = ErrorSeverity.HIGH;
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Error de red. Verifica tu conexión';
        severity = ErrorSeverity.HIGH;
      } else if (error.message?.includes('timeout')) {
        message = 'La solicitud tardó demasiado. Intenta nuevamente';
        severity = ErrorSeverity.MEDIUM;
      }
    }

    this.logError({
      type: ErrorType.NETWORK,
      severity,
      message,
      originalError: error instanceof Error ? error : new Error(String(error)),
      context
    });

    this.showUserNotification(message, severity);
  }

  /**
   * Maneja errores de validación de formularios
   */
  handleValidationError(errors: string[] | string, context?: ErrorContext): void {
    console.warn('⚠️ [Validation Error]:', errors);

    const message = Array.isArray(errors) ? errors.join(', ') : errors;

    this.logError({
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message,
      context
    });

    this.showUserNotification(message, ErrorSeverity.LOW);
  }

  /**
   * Maneja errores de autenticación
   */
  handleAuthError(error: unknown, context?: ErrorContext): void {
    console.error('🔐 [Auth Error]:', error);

    const message = 'Error de autenticación. Por favor, inicia sesión nuevamente';

    this.logError({
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message,
      originalError: error instanceof Error ? error : new Error(String(error)),
      context
    });

    this.showUserNotification(message, ErrorSeverity.HIGH);
  }

  /**
   * Maneja errores de lógica de negocio
   */
  handleBusinessLogicError(message: string, context?: ErrorContext): void {
    console.warn('💼 [Business Logic Error]:', message);

    this.logError({
      type: ErrorType.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      message,
      context
    });

    this.showUserNotification(message, ErrorSeverity.MEDIUM);
  }

  /**
   * Maneja errores desconocidos o no categorizados
   */
  handleUnknownError(error: unknown, context?: ErrorContext): void {
    console.error('❓ [Unknown Error]:', error);

    let message = 'Ha ocurrido un error inesperado';
    
    if (error instanceof Error) {
      message = error.message || message;
    } else if (typeof error === 'string') {
      message = error;
    }

    this.logError({
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message,
      originalError: error instanceof Error ? error : new Error(String(error)),
      context
    });

    this.showUserNotification(message, ErrorSeverity.MEDIUM);
  }

  /**
   * Registra un error en el log interno
   */
  private logError(errorData: Omit<AppError, 'id' | 'timestamp' | 'resolved'>): void {
    const appError: AppError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...errorData
    };

    this.errorLog.unshift(appError);

    // Mantener solo los últimos errores
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // En producción, aquí se enviaría a un servicio de logging externo
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogging(appError);
    }
  }

  /**
   * Muestra notificación al usuario usando el sistema de toast
   */
  private showUserNotification(message: string, severity: ErrorSeverity): void {
    const variant = severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL 
      ? 'destructive' 
      : 'default';

    toast({
      variant,
      title: this.getSeverityTitle(severity),
      description: message,
      duration: this.getSeverityDuration(severity)
    });
  }

  /**
   * Obtiene el título según la severidad
   */
  private getSeverityTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'Error Crítico';
      case ErrorSeverity.HIGH:
        return 'Error';
      case ErrorSeverity.MEDIUM:
        return 'Advertencia';
      case ErrorSeverity.LOW:
        return 'Información';
      default:
        return 'Notificación';
    }
  }

  /**
   * Obtiene la duración del toast según la severidad
   */
  private getSeverityDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000; // 10 segundos
      case ErrorSeverity.HIGH:
        return 7000;  // 7 segundos
      case ErrorSeverity.MEDIUM:
        return 5000;  // 5 segundos
      case ErrorSeverity.LOW:
        return 3000;  // 3 segundos
      default:
        return 5000;
    }
  }

  /**
   * Envía error a servicio de logging externo (placeholder)
   */
  private sendToExternalLogging(error: AppError): void {
    // En producción, aquí se implementaría el envío a servicios como:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - Custom logging service
    console.log('📤 [External Logging]:', error);
  }

  /**
   * Obtiene el log de errores
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Marca un error como resuelto
   */
  markErrorAsResolved(errorId: string): void {
    const error = this.errorLog.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Limpia el log de errores
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      resolved: 0,
      unresolved: 0
    };

    // Inicializar contadores
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Contar errores
    this.errorLog.forEach(error => {
      stats.byType[error.type]++;
      stats.bySeverity[error.severity]++;
      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }
}

// Instancia singleton
export const errorHandler = GlobalErrorHandler.getInstance();

// Funciones de conveniencia para uso directo
export const handleApiError = (error: unknown, context?: ErrorContext) => 
  errorHandler.handleApiError(error, context);

export const handleNetworkError = (error: unknown, context?: ErrorContext) => 
  errorHandler.handleNetworkError(error, context);

export const handleValidationError = (errors: string[] | string, context?: ErrorContext) => 
  errorHandler.handleValidationError(errors, context);

export const handleAuthError = (error: unknown, context?: ErrorContext) => 
  errorHandler.handleAuthError(error, context);

export const handleBusinessLogicError = (message: string, context?: ErrorContext) => 
  errorHandler.handleBusinessLogicError(message, context);

export const handleUnknownError = (error: unknown, context?: ErrorContext) => 
  errorHandler.handleUnknownError(error, context);