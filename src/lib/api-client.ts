// src/lib/api-client.ts
import { handleApiError, handleNetworkError, ErrorContext } from '@/services/ErrorHandler';

export interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  context?: ErrorContext;
  suppressErrorHandling?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders
    };
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 2;
    this.retryDelay = options.retryDelay || 1000;
  }

  private async makeRequest(
    url: string, 
    options: RequestOptions = {}
  ): Promise<Response> {
    const {
      timeout = this.timeout,
      retries = this.retries,
      retryDelay = this.retryDelay,
      context,
      suppressErrorHandling = false,
      headers = {},
      ...fetchOptions
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData: any;
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = { 
                message: response.statusText || 'Error del servidor',
                status: response.status 
              };
            }
          } catch {
            errorData = { 
              message: response.statusText || 'Error del servidor',
              status: response.status 
            };
          }

          // Si es el último intento o un error que no debe reintentarse
          if (attempt === retries || response.status < 500) {
            if (!suppressErrorHandling) {
              handleApiError(errorData, {
                ...context,
                action: `${fetchOptions.method || 'GET'} ${fullUrl}`,
                additionalData: { attempt: attempt + 1, maxRetries: retries + 1 }
              });
            }
            throw errorData;
          }

          lastError = errorData;
          console.log(`🔄 Reintentando solicitud ${attempt + 1}/${retries + 1} para ${fullUrl}`);
        } else {
          return response;
        }
      } catch (error: any) {
        lastError = error;

        // Si es un error de abort (timeout)
        if (error.name === 'AbortError') {
          const timeoutError = {
            message: 'La solicitud tardó demasiado tiempo',
            type: 'timeout',
            originalError: error
          };

          if (!suppressErrorHandling) {
            handleNetworkError(timeoutError, {
              ...context,
              action: `${fetchOptions.method || 'GET'} ${fullUrl}`,
              additionalData: { timeout, attempt: attempt + 1 }
            });
          }
          throw timeoutError;
        }

        // Si es un error de red y no es el último intento
        if (attempt < retries && (
          error instanceof TypeError ||
          error.name === 'NetworkError' ||
          error.message?.includes('fetch') ||
          error.code === 'NETWORK_ERROR'
        )) {
          console.log(`🔄 Reintentando por error de red ${attempt + 1}/${retries + 1} para ${fullUrl}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }

        // Manejar error final
        if (!suppressErrorHandling) {
          if (error instanceof TypeError || error.name === 'NetworkError') {
            handleNetworkError(error, {
              ...context,
              action: `${fetchOptions.method || 'GET'} ${fullUrl}`,
              additionalData: { attempt: attempt + 1, maxRetries: retries + 1 }
            });
          } else {
            handleApiError(error, {
              ...context,
              action: `${fetchOptions.method || 'GET'} ${fullUrl}`,
              additionalData: { attempt: attempt + 1, maxRetries: retries + 1 }
            });
          }
        }

        throw error;
      }

      // Esperar antes del siguiente intento
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError;
  }

  async get(url: string, options: RequestOptions = {}): Promise<Response> {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  async post(url: string, data?: any, options: RequestOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put(url: string, data?: any, options: RequestOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch(url: string, data?: any, options: RequestOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete(url: string, options: RequestOptions = {}): Promise<Response> {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  // Métodos de conveniencia que parsean JSON automáticamente
  async getJson<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.get(url, options);
    return response.json();
  }

  async postJson<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.post(url, data, options);
    return response.json();
  }

  async putJson<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.put(url, data, options);
    return response.json();
  }

  async patchJson<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.patch(url, data, options);
    return response.json();
  }

  async deleteJson<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.delete(url, options);
    return response.json();
  }
}

// Instancia por defecto
export const apiClient = new ApiClient();

// Funciones de conveniencia
export const api = {
  get: (url: string, options?: RequestOptions) => apiClient.get(url, options),
  post: (url: string, data?: any, options?: RequestOptions) => apiClient.post(url, data, options),
  put: (url: string, data?: any, options?: RequestOptions) => apiClient.put(url, data, options),
  patch: (url: string, data?: any, options?: RequestOptions) => apiClient.patch(url, data, options),
  delete: (url: string, options?: RequestOptions) => apiClient.delete(url, options),
  
  // Con parsing JSON automático
  getJson: <T = any>(url: string, options?: RequestOptions) => apiClient.getJson<T>(url, options),
  postJson: <T = any>(url: string, data?: any, options?: RequestOptions) => apiClient.postJson<T>(url, data, options),
  putJson: <T = any>(url: string, data?: any, options?: RequestOptions) => apiClient.putJson<T>(url, data, options),
  patchJson: <T = any>(url: string, data?: any, options?: RequestOptions) => apiClient.patchJson<T>(url, data, options),
  deleteJson: <T = any>(url: string, options?: RequestOptions) => apiClient.deleteJson<T>(url, options)
};