'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/types';

// FIXED TYPE DEFINITION - register returns Promise with success boolean
type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, phone: string, storeId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const router = useRouter();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: "Inicio de sesión exitoso",
          description: `¡Bienvenido, ${data.user.email}!`,
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

  // FIXED REGISTER FUNCTION - Returns Promise with success boolean
  const register = async (
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
        login,
        register,
        logout,
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