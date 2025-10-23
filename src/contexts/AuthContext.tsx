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

  // Helper function to check if user should have automatic store assignment
  const shouldSetActiveStore = (userRole: UserRole): boolean => {
    const shouldSet = userRole !== 'user'; // Solo excluir usuarios regulares
    console.log(`🔍 [shouldSetActiveStore] Role: ${userRole}, Should set: ${shouldSet}`);
    return shouldSet;
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

  // Helper function to redirect users to their appropriate page after login
  const redirectToStoreContext = (user: UserProfile): void => {
    const redirectUrl = getStoreRedirectUrl(user.role);
    console.log(`🔄 Redirecting ${user.role} to: ${redirectUrl}`);
    
    // Use setTimeout to ensure state updates and store switch are complete before redirect
    setTimeout(() => {
      console.log(`🚀 [redirectToStoreContext] Executing redirect to: ${redirectUrl}`);
      router.push(redirectUrl);
    }, 200); // Increased timeout to ensure store switch completes
  };

  // Helper function to set active store for users and redirect after login
  const setActiveStoreForUser = async (user: UserProfile): Promise<void> => {
    console.log(`🔍 [setActiveStoreForUser] Checking user role: ${user.role}`);
    console.log(`🔍 [setActiveStoreForUser] Should set active store: ${shouldSetActiveStore(user.role)}`);
    
    // Handle users that need store assignment (all except 'user')
    if (shouldSetActiveStore(user.role)) {
      console.log(`🔍 [setActiveStoreForUser] User storeId: ${user.storeId}`);
      console.log(`🔍 [setActiveStoreForUser] Current activeStoreId: ${activeStoreId}`);
      
      if (!user.storeId) {
        console.error(`❌ [setActiveStoreForUser] No storeId for administrative user: ${user.email}`);
        throw new Error('Usuario administrativo sin tienda asignada. Contacte al administrador.');
      }

      // Always set the user's store as active, regardless of current activeStoreId
      // This ensures the user logs into their own store context
      if (activeStoreId !== user.storeId) {
        console.log(`🔄 [setActiveStoreForUser] Switching from store ${activeStoreId} to ${user.storeId}`);
      }
      
      console.log(`🏪 [setActiveStoreForUser] Setting activeStoreId: ${user.storeId}`);
      setActiveStoreId(user.storeId);
      
      // Wait a moment to ensure the state update is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the store was actually set
      const currentActiveStore = localStorage.getItem('activeStoreId');
      console.log(`🔍 [setActiveStoreForUser] Verification - localStorage activeStoreId: ${currentActiveStore}`);
      console.log(`🔍 [setActiveStoreForUser] Verification - state activeStoreId: ${activeStoreId}`);
      
      if (currentActiveStore !== user.storeId) {
        console.error(`❌ [setActiveStoreForUser] Store setting failed! Expected: ${user.storeId}, Got: ${currentActiveStore}`);
        throw new Error('Error al configurar la tienda activa. Inténtalo de nuevo.');
      }
      
      console.log(`✅ [setActiveStoreForUser] Active store set for ${user.role}: ${user.storeId}`);
    } else {
      console.log(`⏭️ [setActiveStoreForUser] Skipping store assignment for role: ${user.role}`);
    }
    
    // Redirect user to appropriate page for their role (all users get redirected)
    redirectToStoreContext(user);
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedActiveStoreId = localStorage.getItem('activeStoreId');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          
          // Restore active store ID if it exists
          if (storedActiveStoreId) {
            setActiveStoreIdState(storedActiveStoreId);
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
        console.log('🔍 [AuthContext] Login successful, user data:', data.user);
        console.log('🔍 [AuthContext] User role:', data.user.role);
        console.log('🔍 [AuthContext] User storeId:', data.user.storeId);
        console.log('🔍 [AuthContext] Current activeStoreId before login:', activeStoreId);
        
        // Set user data first
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Force a small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check if we need to switch stores before redirecting
        const needsStoreSwitch = shouldSetActiveStore(data.user.role) && 
                                data.user.storeId && 
                                activeStoreId !== data.user.storeId;
        
        if (needsStoreSwitch) {
          console.log(`🔄 [AuthContext] Store switch needed: ${activeStoreId} → ${data.user.storeId}`);
        }
        
        // Automatic store assignment for administrative users
        try {
          console.log('🔍 [AuthContext] Attempting store assignment for user:', data.user.email);
          console.log('🔍 [AuthContext] User data received from API:', JSON.stringify(data.user, null, 2));
          await setActiveStoreForUser(data.user);
        } catch (storeError: any) {
          console.error('❌ [AuthContext] Store assignment failed:', storeError.message);
          // If store assignment fails, logout and show error
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error(storeError.message);
        }
        
        toast({
          title: "Inicio de sesión exitoso",
          description: `¡Bienvenido, ${data.user.email}!${needsStoreSwitch ? ' Cambiando a tu tienda...' : ''}`,
        });
      } else {
        throw new Error(data.msg || 'Error en el inicio de sesión');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
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
    clearActiveStoreId(); // Clear active store ID on logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
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