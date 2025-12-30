import { useState, useCallback } from 'react';

export const useSubmitState = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const withSubmitState = useCallback(async (submitFunction: () => Promise<void>) => {
    if (isSubmitting) return; // Prevenir doble submit
    
    setIsSubmitting(true);
    try {
      await submitFunction();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  return { isSubmitting, withSubmitState };
};