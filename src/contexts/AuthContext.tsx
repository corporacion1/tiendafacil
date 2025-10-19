// src/contexts/AuthContext.tsx - VERSIÓN CORREGIDA
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { showErrorToast, showSuccessToast } from '@/components/ui/error-toast';
import { showSimpleErrorToast, showSimpleSuccessToast } from '@/components/ui/simple-toast';
import { UserProfile } from '@/lib/types';

type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, phone: string, storeId: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 RESTAURAR SESIÓN COMPLETA
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const savedToken = localStorage.getItem('token');
          const savedUser = localStorage.getItem('user');
          
          if (savedToken && savedUser) {
            // Verificar si el token sigue válido
            try {
              const verifyRes = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${savedToken}` }
              });

              if (verifyRes.ok) {
                // Token válido, restaurar sesión
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
              } else {
                // Token inválido, limpiar
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            } catch (error) {
              console.log('No se pudo verificar token, restaurando de localStorage');
              // Fallback: restaurar desde localStorage sin verificar
              setToken(savedToken);
              setUser(JSON.parse(savedUser));
            }
          }
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login con:', email);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Respuesta del servidor:', res.status);

      let data;
      const contentType = res.headers.get('content-type');
      
      console.log('🔍 [AuthContext] Content-Type:', contentType);
      console.log('🔍 [AuthContext] Response status:', res.status, res.statusText);

      // Leer la respuesta una sola vez
      let responseText: string;
      try {
        responseText = await res.text();
        console.log('📄 Respuesta raw:', responseText);
      } catch (textError) {
        console.error('❌ Error leyendo respuesta:', textError);
        throw new Error('No se pudo leer la respuesta del servidor.');
      }

      // Intentar parsear como JSON
      try {
        if (contentType && contentType.includes('application/json') && responseText.trim()) {
          data = JSON.parse(responseText);
          console.log('📊 Datos parseados exitosamente:', data);
          console.log('📊 Tipo de datos:', typeof data);
          console.log('📊 Keys de datos:', data ? Object.keys(data) : 'data es null/undefined');
        } else {
          console.log('📄 Respuesta no es JSON válido o está vacía');
          data = { 
            error: 'INVALID_RESPONSE', 
            message: 'Respuesta del servidor no válida',
            rawResponse: responseText,
            contentType 
          };
        }
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        console.log('📄 Texto que falló al parsear:', responseText);
        data = { 
          error: 'JSON_PARSE_ERROR', 
          message: 'Error parseando respuesta JSON',
          rawResponse: responseText,
          parseError: parseError.message 
        };
      }

      console.log('🔍 [AuthContext] Verificando condiciones de login...');
      console.log('🔍 [AuthContext] res.ok:', res.ok);
      console.log('🔍 [AuthContext] data.success:', data.success);
      console.log('🔍 [AuthContext] data:', data);

      if (res.ok && data.success) {
        console.log('✅ [AuthContext] Condiciones de login exitoso cumplidas');
        
        // Guardar usuario y token en estado y localStorage
        setUser(data.user);
        const tokenToSave = data.token || 'fake-jwt-token-123';
        setToken(tokenToSave);

        // PERSISTIR EN LOCALSTORAGE
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', tokenToSave);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        try {
          showSuccessToast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          });
        } catch (toastError) {
          console.warn('⚠️ [AuthContext] Error mostrando toast de éxito:', toastError);
          // Fallback to simple toast
          showSimpleSuccessToast("Has iniciado sesión correctamente.");
        }
        
        console.log('✅ Login exitoso - Sesión persistida');
        return; // Exit early on success
      } else {
        console.log('❌ [AuthContext] Login falló - analizando respuesta...');
        
        // Improved error handling with better logging
        const errorInfo = {
          status: res.status,
          statusText: res.statusText,
          data: data,
          dataType: typeof data,
          dataKeys: data ? Object.keys(data) : null,
          error: data?.error || 'UNKNOWN_ERROR',
          success: data?.success,
          msg: data?.msg,
          hasData: !!data,
          dataStringified: JSON.stringify(data)
        };
        
        console.error('❌ Error del servidor (detallado):', errorInfo);
        console.log('🔍 [AuthContext] Análisis de data:');
        console.log('  - data existe:', !!data);
        console.log('  - data tipo:', typeof data);
        console.log('  - data keys:', data ? Object.keys(data) : 'N/A');
        console.log('  - data.error:', data?.error);
        console.log('  - data.msg:', data?.msg);
        console.log('  - data.success:', data?.success);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Credenciales incorrectas. Por favor, intenta de nuevo.';
        
        if (!res.ok) {
          // HTTP error
          if (res.status === 401) {
            errorMessage = 'Email o contraseña incorrectos.';
          } else if (res.status === 500) {
            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          } else if (res.status === 503) {
            errorMessage = 'Servicio no disponible. Inténtalo más tarde.';
          } else {
            errorMessage = `Error del servidor (${res.status}). Inténtalo más tarde.`;
          }
        } else if (data?.error) {
          // Application error
          if (data.error === 'DATABASE_CONNECTION_ERROR') {
            errorMessage = 'Problema de conexión con el servidor. Inténtalo más tarde.';
          } else if (data.error === 'MISSING_CREDENTIALS') {
            errorMessage = 'Por favor, ingresa tu email y contraseña.';
          } else if (data.error === 'INVALID_CREDENTIALS') {
            errorMessage = 'Email o contraseña incorrectos.';
          } else if (data.error === 'PASSWORD_VERIFICATION_ERROR') {
            errorMessage = 'Error al verificar las credenciales. Inténtalo de nuevo.';
          } else if (data.error === 'INTERNAL_SERVER_ERROR') {
            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          }
        } else if (data?.msg) {
          errorMessage = data.msg;
        } else if (!data?.success) {
          errorMessage = 'Login falló. Verifica tus credenciales.';
        }
        
        // Show more helpful messages for development
        if (process.env.NODE_ENV === 'development' && data?.details) {
          errorMessage += ` (${data.details})`;
        }
        
        console.log('🚨 [AuthContext] Lanzando error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('💥 Error en login:', error);
      
      // Determine error type for better UX
      let errorType: 'connection' | 'credentials' | 'server' | 'validation' | 'unknown' = 'unknown';
      
      if (error.message.includes('conexión') || error.message.includes('red')) {
        errorType = 'connection';
      } else if (error.message.includes('credenciales') || error.message.includes('contraseña') || error.message.includes('email')) {
        errorType = 'credentials';
      } else if (error.message.includes('servidor')) {
        errorType = 'server';
      } else if (error.message.includes('datos') || error.message.includes('formato')) {
        errorType = 'validation';
      }
      
      // Mostrar error con múltiples métodos para asegurar que se vea
      const errorMessage = error.message || 'Algo salió mal. Inténtalo más tarde.';
      
      console.log('🚨 [AuthContext] Mostrando error al usuario:', errorMessage);
      
      // Método 1: Alert (siempre funciona) - solo en desarrollo
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        alert(`Error de Login: ${errorMessage}`);
      }
      
      // Método 2: Toast personalizado
      try {
        showErrorToast({
          description: errorMessage,
          errorType
        });
        console.log('✅ [AuthContext] Error toast mostrado exitosamente');
      } catch (toastError) {
        console.warn('⚠️ [AuthContext] Error mostrando error toast:', toastError);
        
        // Método 3: Toast simple (fallback)
        const simpleToastSuccess = showSimpleErrorToast(errorMessage);
        
        if (!simpleToastSuccess) {
          // Método 4: Toast regular (fallback del fallback)
          try {
            toast({
              variant: 'destructive',
              title: 'Error al iniciar sesión',
              description: errorMessage,
            });
            console.log('✅ [AuthContext] Toast regular mostrado como último recurso');
          } catch (regularToastError) {
            console.error('❌ [AuthContext] Error con toast regular:', regularToastError);
            
            // Método 5: Console error visible (último recurso)
            console.error('🚨 ERROR DE LOGIN (mostrar al usuario):', errorMessage);
          }
        }
      }
      
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const register = async (
    email: string,
    password: string,
    phone: string,
    storeId: string
  ) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, phone, storeId }),
      });

      let data;
      const contentType = res.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Respuesta no es JSON:', text);
        throw new Error('El servidor no respondió con JSON válido.');
      }

      if (res.ok) {
        toast({
          title: "Registro exitoso",
          description: "Por favor, inicia sesión.",
        });
        return { success: true };
      } else {
        toast({
          variant: 'destructive',
          title: 'Error en registro',
          description: data.msg || 'Error al registrar usuario',
        });
        return { success: false, error: data.msg };
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo completar el registro.',
      });
      return { success: false, error: error.message };
    }
  };

  // Mostrar loading mientras restaura la sesión
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loading: isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};