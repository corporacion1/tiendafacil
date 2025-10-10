
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
  isSecurityReady: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const STORAGE_KEY = 'tienda_facil_pin';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  // Force unlocked state
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isSecurityReady, setIsSecurityReady] = useState(true);

  // All functions are now mocks that do nothing or return true/false to avoid errors.
  
  const lockApp = useCallback(() => {
    // Does nothing
  }, []);

  const unlockApp = useCallback((pin: string) => {
    // Always returns true
    return true;
  }, []);

  const checkPin = useCallback((pin: string) => {
    // Always returns true
    return true;
  }, []);

  const setPin = useCallback((newPin: string, confirmPin: string) => {
    // Does nothing, returns true
    return true;
  }, []);

  const changePin = useCallback((oldPin: string, newPin: string, confirmPin: string) => {
    // Does nothing, returns true
    return true;
  }, []);

  const removePin = useCallback(() => {
    // Does nothing
  }, []);

  const value = {
    isLocked: false, // Always false
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
