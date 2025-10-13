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

const DEMO_PIN = '1234'; // Using a hardcoded demo PIN

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(true); // Assume demo pin is always set
  const [isSecurityReady, setIsSecurityReady] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // In a pure local demo, we can consider security ready immediately.
    setIsSecurityReady(true);
  }, []);

  const lockApp = useCallback(() => {
    const isPublicPage = pathname.startsWith('/catalog') || pathname.startsWith('/login');
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

  // Mocking PIN management functions
  const setPin = (newPin: string, confirmPin: string): boolean => {
    toast({ title: "Función no disponible en modo DEMO" });
    return false;
  }
  
  const removePin = () => {
    toast({ title: "Función no disponible en modo DEMO" });
  }

  const changePin = (oldPin: string, newPin: string, confirmPin: string): boolean => {
    if (oldPin !== DEMO_PIN) return false;
    toast({ title: "Función no disponible en modo DEMO" });
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
