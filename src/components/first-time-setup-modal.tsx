
'use client';

import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import { useUser as useUserProfile } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SUPER_ADMIN_UID } from '@/firebase/auth/use-user';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';

export function FirstTimeSetupModal() {
  const { user: authUser } = useAuthUser();
  const { needsProfileCreation } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    // Show modal if user is authenticated and needs a profile.
    if (authUser && needsProfileCreation) {
      setFormData({
        displayName: authUser.displayName || '',
        email: authUser.email || '',
        phone: authUser.phoneNumber || '',
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [authUser, needsProfileCreation]);

  const handleCreateProfile = async () => {
    if (!authUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a Firebase.' });
      return;
    }
    if (!formData.displayName.trim() || !formData.email.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Nombre y correo son requeridos.' });
        return;
    }

    setIsProcessing(true);

    // Asigna el rol basado en el UID.
    const role = authUser.uid === SUPER_ADMIN_UID ? 'superAdmin' : 'user';
    // Solicita una tienda solo si es un usuario normal.
    const storeRequest = role === 'user'; 

    const newUserProfile: UserProfile = {
      uid: authUser.uid,
      email: formData.email,
      displayName: formData.displayName,
      photoURL: authUser.photoURL,
      phone: formData.phone || null,
      role: role,
      status: 'active',
      storeRequest: storeRequest,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const userDocRef = doc(firestore, 'users', authUser.uid);
      await setDoc(userDocRef, newUserProfile);
      
      toast({
        title: '¡Perfil Creado!',
        description: 'Tu cuenta ha sido configurada. La página se recargará para aplicar los cambios.',
      });

      // Recarga la página para que los nuevos datos del perfil se carguen correctamente.
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Crear Perfil',
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>¡Bienvenido! Completa tu Registro</DialogTitle>
          <DialogDescription>
            Es tu primer inicio de sesión. Por favor, confirma tus datos para crear tu perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
                {authUser?.photoURL && (
                    <Image src={authUser.photoURL} alt="Avatar" width={64} height={64} className="rounded-full" />
                )}
                <div className="flex-grow space-y-2">
                    <Label htmlFor="displayName">Nombre a Mostrar *</Label>
                    <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData(prev => ({...prev, displayName: e.target.value}))} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} placeholder="Ej: 584121234567" />
            </div>
        </div>
        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={handleCreateProfile}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando Perfil...
              </>
            ) : (
              'Confirmar y Crear Perfil'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
