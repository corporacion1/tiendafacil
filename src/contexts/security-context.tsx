
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface SecurityContextType {
  isLocked: boolean;
  unlockApp: (pin: string) => void;
  lockApp: () => void;
  setPin: (newPin: string, confirmPin: string) => void;
  hasPin: boolean;
  removePin: () => void;
  changePin: (oldPin: string, newPin: string, confirmPin: string) => boolean;
  isPinLoading: boolean;
  isMounted: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const STORAGE_KEY = 'tienda_facil_pin';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // To prevent hydration issues
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const pinFromStorage = localStorage.getItem(STORAGE_KEY);
      if (pinFromStorage) {
        setStoredPin(pinFromStorage);
        setHasPin(true);
        setIsLocked(true); 
      } else {
        setHasPin(false);
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
      setIsLocked(false);
      setHasPin(false);
    } finally {
        setIsPinLoading(false);
    }
  }, []);
  
  const lockApp = useCallback(() => {
    if (storedPin) {
      setIsLocked(true);
    }
  }, [storedPin]);

  const unlockApp = useCallback((pin: string) => {
    if (pin === storedPin) {
      setIsLocked(false);
      toast({
        title: "Desbloqueado",
        description: "Bienvenido de nuevo.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "PIN incorrecto",
        description: "El PIN que ingresaste es incorrecto. Inténtalo de nuevo.",
      });
    }
  }, [storedPin, toast]);

  const setPin = useCallback((newPin: string, confirmPin: string) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        toast({
            variant: "destructive",
            title: "PIN inválido",
            description: "El PIN debe contener exactamente 4 dígitos numéricos."
        });
        return;
    }
    if (newPin !== confirmPin) {
        toast({
            variant: "destructive",
            title: "Los PINES no coinciden",
            description: "El nuevo PIN y su confirmación no son iguales."
        });
        return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, newPin);
      setStoredPin(newPin);
      setHasPin(true);
      setIsLocked(true);
      toast({
        title: "PIN de seguridad establecido",
        description: "La aplicación se bloqueará al iniciar o al salir del POS.",
      });
    } catch (error) {
      console.error("Could not access localStorage", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el PIN.",
      });
    }
  }, [toast]);

  const changePin = useCallback((oldPin: string, newPin: string, confirmPin: string) => {
    if (oldPin !== storedPin) {
      toast({
        variant: "destructive",
        title: "PIN Actual Incorrecto",
        description: "El PIN actual que ingresaste no es correcto.",
      });
      return false;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast({
        variant: "destructive",
        title: "PIN Nuevo Inválido",
        description: "El nuevo PIN debe contener exactamente 4 dígitos numéricos.",
      });
      return false;
    }
     if (newPin !== confirmPin) {
        toast({
            variant: "destructive",
            title: "Los PINES no coinciden",
            description: "El nuevo PIN y su confirmación no son iguales."
        });
        return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, newPin);
      setStoredPin(newPin);
      setIsLocked(true); // Re-lock the app for security
      toast({
        title: "PIN Cambiado Exitosamente",
        description: "Tu PIN de seguridad ha sido actualizado. Por favor, desbloquea la app con tu nuevo PIN.",
      });
      return true;
    } catch (error) {
       console.error("Could not access localStorage", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "No se pudo guardar el nuevo PIN.",
       });
       return false;
    }
  }, [storedPin, toast]);

  const removePin = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStoredPin(null);
      setHasPin(false);
      setIsLocked(false);
      toast({
        title: "PIN de seguridad eliminado",
        description: "La aplicación ya no se bloqueará.",
      });
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, [toast]);

  const value = {
    isLocked,
    unlockApp,
    lockApp,
    setPin,
    hasPin,
    removePin,
    changePin,
    isPinLoading,
    isMounted
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
