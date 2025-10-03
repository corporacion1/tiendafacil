
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Start unlocked
  const { toast } = useToast();
  const inactivityTimer = useRef<NodeJS.Timeout>();

  const lockApp = useCallback(() => {
    if (storedPin) {
      setIsLocked(true);
    }
  }, [storedPin]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(lockApp, INACTIVITY_TIMEOUT);
  }, [lockApp]);

  useEffect(() => {
    try {
      let pinFromStorage = localStorage.getItem(STORAGE_KEY);
      if (!pinFromStorage) {
          pinFromStorage = "1234";
          localStorage.setItem(STORAGE_KEY, pinFromStorage);
      }
      setStoredPin(pinFromStorage);
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    // This effect is now only for inactivity locking when already unlocked
    if (!isLocked && storedPin) {
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetInactivityTimer));
      resetInactivityTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
      };
    }
  }, [isLocked, storedPin, resetInactivityTimer]);


  const unlockApp = useCallback((pin: string) => {
    if (pin === storedPin) {
      setIsLocked(false);
      resetInactivityTimer();
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
  }, [storedPin, toast, resetInactivityTimer]);

  const setPin = useCallback((newPin: string) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        toast({
            variant: "destructive",
            title: "PIN inválido",
            description: "El PIN debe contener exactamente 4 dígitos numéricos."
        });
        return;
    }
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
       if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
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
