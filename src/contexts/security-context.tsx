"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface SecurityContextType {
  isLocked: boolean;
  unlockApp: (pin: string) => void;
  lockApp: () => void;
  setPin: (newPin: string) => void;
  hasPin: boolean;
  removePin: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const STORAGE_KEY = 'tienda_facil_pin';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const pinFromStorage = localStorage.getItem(STORAGE_KEY);
      setStoredPin(pinFromStorage);
      if (pinFromStorage) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
      setIsLocked(false);
    }
  }, []);

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

  const lockApp = useCallback(() => {
    if (storedPin) {
      setIsLocked(true);
    }
  }, [storedPin]);

  const setPin = useCallback((newPin: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, newPin);
      setStoredPin(newPin);
      setIsLocked(true);
      toast({
        title: "PIN de seguridad establecido",
        description: "La aplicación se bloqueará la próxima vez que la abras.",
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

  const removePin = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStoredPin(null);
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
    hasPin: !!storedPin,
    removePin,
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
