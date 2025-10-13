
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

const DEMO_PIN = '1234'; // Hardcoded demo PIN
const PIN_ENABLED_KEY = 'tienda_facil_pin_enabled';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isSecurityReady, setIsSecurityReady] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const pinEnabled = localStorage.getItem(PIN_ENABLED_KEY);
      // Default to true if it's the first time
      setHasPin(pinEnabled === null ? true : pinEnabled === 'true');
    } catch (e) {
      // In SSR or if localStorage is disabled, default to true
      setHasPin(true);
    }
    setIsSecurityReady(true);
  }, []);

  const lockApp = useCallback(() => {
    const isPublicPage = pathname.startsWith('/catalog') || pathname.startsWith('/login') || pathname === '/';
    if (hasPin && !isPublicPage) {
      setIsLocked(true);
    }
  }, [hasPin, pathname]);

  const unlockApp = useCallback((pin: string) => {
    if (pin === DEMO_PIN) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const checkPin = useCallback((pin: string) => {
    return pin === DEMO_PIN;
  }, []);

  const setPin = (newPin: string, confirmPin: string): boolean => {
    if (newPin !== confirmPin || newPin !== DEMO_PIN) {
      toast({ variant: 'destructive', title: 'Error', description: 'En modo DEMO, el único PIN permitido es "1234".' });
      return false;
    }
    try {
      localStorage.setItem(PIN_ENABLED_KEY, 'true');
    } catch (e) { console.error(e); }
    setHasPin(true);
    return true;
  }
  
  const removePin = () => {
    try {
      localStorage.setItem(PIN_ENABLED_KEY, 'false');
    } catch (e) { console.error(e); }
    setHasPin(false);
  }

  const changePin = (oldPin: string, newPin: string, confirmPin: string): boolean => {
    toast({ title: "Función no disponible en modo DEMO", description: "El cambio de PIN está deshabilitado." });
    return false;
  }

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
      {isSecurityReady && isLocked && <PinModal />}
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
