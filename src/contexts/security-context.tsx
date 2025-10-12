
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PinModal } from '@/components/pin-modal';
import { useToast } from "@/hooks/use-toast";
import { usePathname } from 'next/navigation';

interface SecurityContextType {
  isLocked: boolean;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  setPin: (newPin: string, confirmPin: string) => boolean;
  hasPin: boolean;
  removePin: () => void;
  changePin: (oldPin: string, newPin: string, confirmPin: string) => boolean;
  checkPin: (pin: string) => boolean;
  isSecurityReady: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const STORAGE_KEY = 'tienda_facil_pin';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isSecurityReady, setIsSecurityReady] = useState(false);
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const pinFromStorage = localStorage.getItem(STORAGE_KEY);
      if (pinFromStorage) {
        setStoredPin(pinFromStorage);
        setHasPin(true);
        setIsLocked(true); // Lock the app if PIN exists
      } else {
        setHasPin(false);
        setIsLocked(false); // No PIN, no lock
      }
    } catch (error) {
        console.error("Could not access localStorage for PIN", error);
    } finally {
        setIsSecurityReady(true);
    }
  }, []);

  useEffect(() => {
    // Lock app when navigating away from POS page if PIN is set
    if (hasPin && pathname !== '/pos' && !isLocked) {
      // This part is tricky. For now, we lock it when app loads.
      // A more robust solution might use session storage to track unlocked state per session.
    }
  }, [pathname, hasPin, isLocked]);

  const lockApp = useCallback(() => {
    if (hasPin) {
      setIsLocked(true);
    }
  }, [hasPin]);

  const unlockApp = useCallback((pin: string) => {
    if (pin === storedPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [storedPin]);

  const checkPin = useCallback((pin: string) => {
    return pin === storedPin;
  }, [storedPin]);

  const setPin = useCallback((newPin: string, confirmPin: string) => {
    if (newPin !== confirmPin || newPin.length !== 4) return false;
    try {
        localStorage.setItem(STORAGE_KEY, newPin);
        setStoredPin(newPin);
        setHasPin(true);
        setIsLocked(true); // Lock after setting a new pin
        return true;
    } catch (error) {
        console.error("Failed to set PIN in localStorage", error);
        toast({
            variant: "destructive",
            title: "Error de Almacenamiento",
            description: "No se pudo guardar el PIN. El almacenamiento local podría estar lleno o deshabilitado."
        });
        return false;
    }
  }, [toast]);

  const changePin = useCallback((oldPin: string, newPin: string, confirmPin: string) => {
    if (oldPin !== storedPin) return false;
    if (newPin !== confirmPin || newPin.length !== 4) return false;
     try {
        localStorage.setItem(STORAGE_KEY, newPin);
        setStoredPin(newPin);
        setIsLocked(true); // Re-lock after changing pin
        return true;
    } catch (error) {
        console.error("Failed to change PIN in localStorage", error);
        toast({
            variant: "destructive",
            title: "Error de Almacenamiento",
            description: "No se pudo guardar el nuevo PIN."
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
    } catch (error) {
        console.error("Failed to remove PIN from localStorage", error);
    }
  }, []);

  const value = {
    isLocked,
    unlockApp,
    lockApp,
    setPin,
    hasPin,
    removePin,
    changePin,
    checkPin,
    isSecurityReady,
  };

  return (
    <SecurityContext.Provider value={value}>
      {isLocked && <PinModal />}
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
