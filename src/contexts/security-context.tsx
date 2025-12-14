'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/settings-context';

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
  const { activeStoreId } = useSettings();
  const { toast } = useToast();
  const [securityState, setSecurityState] = useState({
    hasPin: false,
    isPinLocked: false,
    remainingAttempts: 5
  });

  useEffect(() => {
    const checkPinStatus = async () => {
      if (!activeStoreId) return;
      try {
        const res = await fetch(`/api/security/status?storeId=${activeStoreId}`);
        const data = await res.json();
        if (res.ok) {
          if (data.hasPin) {
            setSecurityState(prev => ({
              ...prev,
              hasPin: true,
              isPinLocked: true, // Proactively lock the app
              remainingAttempts: data.remainingAttempts || 5
            }));
          } else {
            setSecurityState(prev => ({
              ...prev,
              hasPin: false,
              isPinLocked: false,
              remainingAttempts: 5
            }));
          }
        }
      } catch (error) {
        console.error("Error checking PIN status:", error);
      }
    };

    if (user) {
      checkPinStatus();
    }
  }, [user, activeStoreId]);



  const setPin = async (currentPin: string, newPin: string): Promise<boolean> => {
    console.log('🔐 [SecurityContext] setPin called', { activeStoreId, hasDetails: !!currentPin, newPinLength: newPin.length });

    if (!activeStoreId) {
      console.error('❌ [SecurityContext] setPin failed: No activeStoreId');
      toast({
        variant: "destructive",
        title: "Error de Configuración",
        description: "No se identificó la tienda activa. Intenta recargar la página.",
      });
      return false;
    }
    try {
      console.log('🚀 [SecurityContext] Sending PIN update request...');
      const res = await fetch('/api/security/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin, storeId: activeStoreId })
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
    if (!activeStoreId) {
      console.error('❌ [Security Context] No activeStoreId available for PIN check.');
      return false;
    }
    try {
      console.log(`🔐 [Security Context] Verificando PIN para store: ${activeStoreId}`);

      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, storeId: activeStoreId })
      });

      const data = await res.json();
      console.log('📥 [Security Context] Response received:', { status: res.status, ok: res.ok, data });

      if (!res.ok) {
        console.error('❌ [Security Context] PIN verification failed:', data.error);
        setSecurityState(prev => ({
          ...prev,
          remainingAttempts: data.remainingAttempts || 0,
          isPinLocked: data.isLocked || prev.isPinLocked // Mantener bloqueado si la API no lo cambia
        }));
        throw new Error(data.error || `Error ${res.status}`);
      }

      if (data.isValid) {
        console.log('✅ [Security Context] PIN válido. Desbloqueando...');
        setSecurityState(prev => ({
          ...prev,
          isPinLocked: false,
          remainingAttempts: 5
        }));
      } else {
        console.warn('⚠️ [Security Context] PIN inválido según la API.');
        setSecurityState(prev => ({
          ...prev,
          remainingAttempts: data.remainingAttempts || 0,
          isPinLocked: data.isLocked || true // Asegurarse de que sigue bloqueado
        }));
      }

      return data.isValid;
    } catch (error) {
      console.error("❌ [Security Context] Error verifying PIN:", error);
      // Lanzar el error para que el modal pueda manejarlo
      throw error;
    }
  };

  const removePin = async (): Promise<void> => {
    if (!activeStoreId) return;
    try {
      const res = await fetch('/api/security/pin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId })
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