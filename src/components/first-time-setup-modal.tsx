
'use client';

import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import { useUser as useUserProfile } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SUPER_ADMIN_UID } from '@/firebase/auth/use-user';
import type { UserProfile } from '@/lib/types';
import { useSettings } from '@/contexts/settings-context';

export function FirstTimeSetupModal() {
  const { user: authUser, isUserLoading: isAuthLoading } = useAuthUser();
  const { user: profile, isUserLoading: isProfileLoading } = useUserProfile();
  const { useDemoData } = useSettings();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  useEffect(() => {
    // Determine if the modal should be shown
    const isSuperAdmin = authUser?.uid === SUPER_ADMIN_UID;
    const profileDoesNotExist = !profile && !isProfileLoading;
    const notInDemoMode = !useDemoData;
    
    if (isSuperAdmin && profileDoesNotExist && notInDemoMode) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [authUser, profile, isProfileLoading, useDemoData]);

  const handleCreateProfile = async () => {
    if (!authUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a Firebase.' });
      return;
    }

    setIsCreatingProfile(true);

    const superAdminProfile: UserProfile = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      photoURL: authUser.photoURL,
      role: 'superAdmin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    try {
      const userDocRef = doc(firestore, 'users', authUser.uid);
      await setDoc(userDocRef, superAdminProfile);
      
      toast({
        title: '¡Perfil de SuperAdmin Creado!',
        description: 'Tu cuenta ha sido configurada. La página se recargará.',
      });

      // reload the page to refetch the profile correctly.
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error: any) {
      console.error('Error creating super admin profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Crear Perfil',
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // We don't want to show anything if we're still checking auth or in demo mode
  if (isAuthLoading || useDemoData || !showModal) {
    return null;
  }

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>¡Bienvenido, SuperAdmin!</DialogTitle>
          <DialogDescription>
            Detectamos que es tu primer inicio de sesión. Para continuar, necesitas crear tu perfil de administrador en la base de datos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
            <p>Esta acción es segura y necesaria para tomar control de la aplicación.</p>
        </div>
        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={handleCreateProfile}
            disabled={isCreatingProfile}
          >
            {isCreatingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando Perfil...
              </>
            ) : (
              'Crear mi Perfil de SuperAdmin'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
