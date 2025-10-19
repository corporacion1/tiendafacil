'use client'; 

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityContextType {
  hasPin: boolean;
  setPin: (currentPin: string, newPin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  removePin: () => Promise<void>;
  checkPin: (pin: string) => Promise<boolean>;
  isPinLocked: boolean;
  remainingAttempts: number;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [securityState, setSecurityState] = useState({
    hasPin: false,
    isPinLocked: false,
    remainingAttempts: 5
  });

  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const res = await fetch('/api/security/status');
        const data = await res.json();
        if (res.ok) {
          setSecurityState({
            hasPin: data.hasPin,
            isPinLocked: data.isLocked,
            remainingAttempts: data.remainingAttempts
          });
        }
      } catch (error) {
        console.error("Error checking PIN status:", error);
      }
    };

    if (user) checkPinStatus();
  }, [user]);

  const checkPinStatus = async () => {
  try {
    const res = await fetch('/api/security/status');
    
    // Verificar si la respuesta es JSON
  const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API returned non-JSON response');
    }
    
    const data = await res.json();
    if (res.ok) {
      setSecurityState({
        hasPin: data.hasPin,
        isPinLocked: data.isLocked,
        remainingAttempts: data.remainingAttempts
      });
    }
  } catch (error) {
    console.error("Error checking PIN status:", error);
  }
};

  const setPin = async (currentPin: string, newPin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/security/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      setSecurityState(prev => ({
        ...prev,
        hasPin: true,
        isPinLocked: false,
        remainingAttempts: 5
      }));

      toast({
        title: "PIN configurado",
        description: "Tu PIN de seguridad ha sido establecido correctamente",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al configurar PIN",
        description: error.message,
      });
      return false;
    }
  };

  const checkPin = async (pin: string): Promise<boolean> => {
    try {
      console.log('🔐 [Security Context] Verificando PIN...');
      
      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      console.log('📥 [Security Context] Response status:', res.status);
      
      const data = await res.json();
      console.log('📥 [Security Context] Response data:', data);
      
      if (!res.ok) {
        console.error('❌ [Security Context] PIN verification failed:', data.error);
        setSecurityState(prev => ({
          ...prev,
          remainingAttempts: data.remainingAttempts || 0,
          isPinLocked: data.isLocked || false
        }));
        throw new Error(data.error);
      }

      console.log('✅ [Security Context] PIN verification result:', data.isValid);
      return data.isValid;
    } catch (error) {
      console.error("❌ [Security Context] Error verifying PIN:", error);
      return false;
    }
  };

  const removePin = async (): Promise<void> => {
    try {
      const res = await fetch('/api/security/pin', {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error("Error al eliminar PIN");

      setSecurityState(prev => ({
        ...prev,
        hasPin: false,
        isPinLocked: false,
        remainingAttempts: 5
      }));

      toast({
        title: "PIN eliminado",
        description: "El PIN de seguridad ha sido removido",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el PIN",
      });
    }
  };

  // Función para cambiar PIN (alias de setPin para compatibilidad)
  const changePin = setPin;

  return (
    <SecurityContext.Provider value={{
      hasPin: securityState.hasPin,
      setPin,
      changePin,
      removePin,
      checkPin,
      isPinLocked: securityState.isPinLocked,
      remainingAttempts: securityState.remainingAttempts
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};