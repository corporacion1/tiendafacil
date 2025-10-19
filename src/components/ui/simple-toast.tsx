// src/components/ui/simple-toast.tsx
'use client';

import { toast } from '@/hooks/use-toast';

export function showSimpleErrorToast(message: string) {
  console.log('🍞 [Simple Toast] Mostrando error:', message);
  
  try {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
      duration: 5000,
    });
    console.log('✅ [Simple Toast] Toast mostrado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ [Simple Toast] Error mostrando toast:', error);
    return false;
  }
}

export function showSimpleSuccessToast(message: string) {
  console.log('🍞 [Simple Toast] Mostrando éxito:', message);
  
  try {
    toast({
      title: 'Éxito',
      description: message,
      duration: 3000,
    });
    console.log('✅ [Simple Toast] Toast de éxito mostrado');
    return true;
  } catch (error) {
    console.error('❌ [Simple Toast] Error mostrando toast de éxito:', error);
    return false;
  }
}

export function testToast() {
  console.log('🧪 [Simple Toast] Probando toast...');
  
  const success = showSimpleErrorToast('Este es un mensaje de prueba');
  
  if (!success) {
    console.error('❌ [Simple Toast] Test falló - toast no funciona');
    alert('Toast no funciona - usando alert como fallback');
  } else {
    console.log('✅ [Simple Toast] Test exitoso');
  }
  
  return success;
}