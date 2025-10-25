'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/lib/types';

// VERCEL CACHE FIX 2025-10-21 - register returns Promise with success boolean
type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  activeStoreId: string | null;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, phone: string, storeId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveStoreId: (storeId: string) => void;
  clearActiveStoreId: () => void;
  getActiveStoreId: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const router = useRouter();

  // Store management functions
  const setActiveStoreId = (storeId: string) => {
    console.log(`🏪 [setActiveStoreId] Setting activeStoreId to: ${storeId}`);
    console.log(`🏪 [setActiveStoreId] Previous activeStoreId: ${activeStoreId}`);
    
    setActiveStoreIdState(storeId);
    localStorage.setItem('activeStoreId', storeId);
    
    console.log(`🏪 [setActiveStoreId] localStorage updated with: ${localStorage.getItem('activeStoreId')}`);
  };

  const clearActiveStoreId = () => {
    setActiveStoreIdState(null);
    localStorage.removeItem('activeStoreId');
  };

  const getActiveStoreId = () => {
    return activeStoreId;
  };

  // Helper function to get redirect URL based on user role
  const getStoreRedirectUrl = (userRole: UserRole): string => {
    switch (userRole) {
      case 'admin':
        return '/dashboard';
      case 'pos':
        return '/pos';
      case 'depositary':
        return '/inventory';
      case 'su':
        return '/dashboard'; // Super usuarios van al dashboard
      case 'user':
        return '/catalog'; // Usuarios regulares van al catálogo
      default:
        return '/dashboard';
    }
  };

  // Restore session on mount - restore token and activeStoreId
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Restore activeStoreId
        const storedActiveStoreId = localStorage.getItem('activeStoreId');
        if (storedActiveStoreId) {
          setActiveStoreIdState(storedActiveStoreId);
        }
        
        // Restore token and validate session
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          try {
            // Verify token with backend
            const res = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`
              }
            });
            
            if (res.ok) {
              const data = await res.json();
              setToken(storedToken);
              setUser(data.user);
              console.log('✅ [AuthContext] Session restored for:', data.user.email);
            } else {
              // Token invalid, clear it
              localStorage.removeItem('authToken');
              console.log('🔄 [AuthContext] Invalid token cleared');
            }
          } catch (error) {
            localStorage.removeItem('authToken');
            console.log('🔄 [AuthContext] Token verification failed, cleared');
          }
        }
        
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('activeStoreId');
      } finally {
        setIsLoading(false);
        setSessionRestored(true);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        console.log('✅ [Login] Authentication successful for:', data.user.email);
        console.log('🔍 [Login] User role:', data.user.role);
        console.log('🔍 [Login] User storeId:', data.user.storeId);
        
        // STEP 1: Set user data and token (login successful) - WITH PERSISTENCE
        setToken(data.token);
        setUser(data.user);
        // Guardar solo el token en localStorage para mantener sesión
        localStorage.setItem('authToken', data.token);
        console.log('✅ [Login] User session set with token persistence');
        
        // STEP 2: If role is NOT "user", update activeStoreId with user's storeId IMMEDIATELY
        if (data.user.role !== 'user') {
          console.log('🏪 [Login] Administrative user - setting active store to:', data.user.storeId);
          
          if (!data.user.storeId) {
            throw new Error('Usuario administrativo sin tienda asignada. Contacte al administrador.');
          }
          
          // Update active store ID IMMEDIATELY and SYNCHRONOUSLY
          console.log('🔄 [Login] BEFORE - activeStoreId:', activeStoreId);
          setActiveStoreIdState(data.user.storeId);
          localStorage.setItem('activeStoreId', data.user.storeId);
          console.log('🔄 [Login] AFTER - localStorage activeStoreId:', localStorage.getItem('activeStoreId'));
          console.log('✅ [Login] Active store updated to:', data.user.storeId);
        } else {
          console.log('👤 [Login] Regular user - no store assignment needed');
        }
        
        // STEP 3: Redirect to appropriate page based on role
        const redirectUrl = getStoreRedirectUrl(data.user.role);
        console.log('🚀 [Login] Redirecting to:', redirectUrl);
        
        toast({
          title: "Inicio de sesión exitoso",
          description: `¡Bienvenido, ${data.user.email}!`,
        });
        
        // Redirect after a longer delay to ensure state propagation to SettingsContext
        setTimeout(() => {
          console.log('🚀 [Login] Executing redirect to:', redirectUrl);
          console.log('🔍 [Login] Final activeStoreId check:', localStorage.getItem('activeStoreId'));
          router.push(redirectUrl);
        }, 300); // Increased delay to ensure state propagation
        
      } else {
        throw new Error(data.msg || 'Error en el inicio de sesión');
      }
    } catch (error: any) {
      console.error('❌ [Login] Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
        description: error.message || 'No se pudo iniciar sesión.',
      });
      throw error;
    }
  };

  // VERCEL CACHE FIX - Returns Promise with success boolean
  const registerUser = async (
    email: string,
    password: string,
    phone: string,
    storeId: string
  ): Promise<{ success: boolean; error?: string }> => {
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

  const logout = (): void => {
    setUser(null);
    setToken(null);
    // NO limpiar activeStoreId en logout para mantener la tienda seleccionada
    // clearActiveStoreId(); 
    
    // Limpiar solo el token de autenticación
    localStorage.removeItem('authToken');
    
    console.log('🚪 [Logout] User session cleared (activeStoreId preserved)');
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
    
    router.push('/');
  };

  // Show loading while restoring session
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading: isLoading,
        activeStoreId,
        login,
        registerUser,
        logout,
        setActiveStoreId,
        clearActiveStoreId,
        getActiveStoreId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};