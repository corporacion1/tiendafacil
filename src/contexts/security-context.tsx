
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

const DEMO_PIN = '1234';
const PIN_ENABLED_KEY = 'tienda_facil_pin_enabled';

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isSecurityReady, setIsSecurityReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const pinEnabled = localStorage.getItem(PIN_ENABLED_KEY);
      const pinIsActive = pinEnabled === null ? true : pinEnabled === 'true';
      setHasPin(pinIsActive);
      // Initially lock the app if the pin is active
      if (pinIsActive) {
          setIsLocked(true);
      }
    } catch (e) {
      setHasPin(true);
      setIsLocked(true);
    }
    setIsSecurityReady(true);
  }, []);

  const lockApp = useCallback(() => {
    if (hasPin) {
      setIsLocked(true);
    }
  }, [hasPin]);

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
    if (newPin !== confirmPin) {
      toast({ variant: 'destructive', title: 'Error', description: 'Los PINES no coinciden.' });
      return false;
    }
     if (newPin !== DEMO_PIN) {
      toast({ variant: 'destructive', title: 'Error en Modo DEMO', description: 'En modo DEMO, el único PIN permitido es "1234".' });
      return false;
    }
    try {
      localStorage.setItem(PIN_ENABLED_KEY, 'true');
    } catch (e) { console.error(e); }
    setHasPin(true);
    lockApp(); // Lock the app immediately after setting a pin
    return true;
  }
  
  const removePin = () => {
    try {
      localStorage.setItem(PIN_ENABLED_KEY, 'false');
    } catch (e) { console.error(e); }
    setHasPin(false);
    setIsLocked(false); // Unlock the app when PIN is removed
  }

  const changePin = (oldPin: string, newPin: string, confirmPin: string): boolean => {
    if (oldPin !== DEMO_PIN) {
      return false;
    }
    if (newPin !== confirmPin || newPin !== DEMO_PIN) {
        toast({ variant: 'destructive', title: 'Error en Modo DEMO', description: 'En modo DEMO, el único PIN permitido es "1234".' });
        return false;
    }
    // In a real app, you would update the stored PIN here.
    // For demo, we just confirm it works and re-lock.
    lockApp();
    return true;
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
