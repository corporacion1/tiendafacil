
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface SecurityContextType {
  isLocked: boolean;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  setPin: (newPin: string, confirmPin: string) => boolean;
  hasPin: boolean;
  removePin: () => void;
  changePin: (oldPin: string, newPin: string, confirmPin: string) => boolean;
  checkPin: (pin: string) => boolean;
  isPinLoading: boolean;
  isSecurityReady: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const STORAGE_KEY = 'tienda_facil_pin';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true); // Default to locked
  const [hasPin, setHasPin] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(true);
  const [isSecurityReady, setIsSecurityReady] = useState(false);

  useEffect(() => {
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
        setIsSecurityReady(true);
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
      return true;
    }
    return false;
  }, [storedPin]);

  const checkPin = useCallback((pin: string) => {
    return pin === storedPin;
  }, [storedPin]);

  const setPin = useCallback((newPin: string, confirmPin: string) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return false;
    }
    if (newPin !== confirmPin) {
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, newPin);
      setStoredPin(newPin);
      setHasPin(true);
      setIsLocked(true);
      return true;
    } catch (error) {
      console.error("Could not access localStorage", error);
      return false;
    }
  }, []);

  const changePin = useCallback((oldPin: string, newPin: string, confirmPin: string) => {
    if (oldPin !== storedPin) return false;
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return false;
    if (newPin !== confirmPin) return false;

    try {
      localStorage.setItem(STORAGE_KEY, newPin);
      setStoredPin(newPin);
      setIsLocked(true);
      return true;
    } catch (error) {
       console.error("Could not access localStorage", error);
       return false;
    }
  }, [storedPin]);

  const removePin = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStoredPin(null);
      setHasPin(false);
      setIsLocked(false);
    } catch (error) {
      console.error("Could not access localStorage", error);
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
    isPinLoading,
    isSecurityReady,
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
