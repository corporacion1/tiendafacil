import { useState, useEffect } from 'react';

interface UseNetworkStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Back online');
      setIsOnline(true);
      if (wasOffline) {
        // Marcar que acabamos de volver online para trigger refetch
        setTimeout(() => setWasOffline(false), 1000);
      }
    };

    const handleOffline = () => {
      console.log('📵 Network: Gone offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};