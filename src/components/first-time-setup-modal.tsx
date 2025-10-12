
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser as useAuthUser } from '@/firebase/provider';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SUPER_ADMIN_UID, useUser as useUserProfile } from '@/firebase/auth/use-user';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileSchema = z.object({
  displayName: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Debe ser un correo electrónico válido.'),
  phone: z.string().regex(/^(0412|0414|0416|0424|0426)\d{7}$/, "El teléfono debe tener 11 dígitos y un prefijo válido (0412, 0414, 0416, 0424, 0426)."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function FirstTimeSetupModal() {
  const { user: authUser } = useAuthUser();
  const { needsProfileCreation } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (authUser && needsProfileCreation) {
      form.reset({
        displayName: authUser.displayName || '',
        email: authUser.email || '',
        phone: authUser.phoneNumber || '',
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [authUser, needsProfileCreation, form]);

  const handleCreateProfile = async (data: ProfileFormValues) => {
    if (!authUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a Firebase.' });
      return;
    }

    setIsProcessing(true);

    const role = authUser.uid === SUPER_ADMIN_UID ? 'superAdmin' : 'user';
    const storeRequest = role === 'user'; 

    const newUserProfile: UserProfile = {
      uid: authUser.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: authUser.photoURL,
      phone: data.phone,
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateProfile)} className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              {authUser?.photoURL && (
                <Image src={authUser.photoURL} alt="Avatar" width={64} height={64} className="rounded-full" />
              )}
              <div className="flex-grow">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre a Mostrar *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} readOnly className="bg-muted/50 cursor-not-allowed" />
                  </FormControl>
                  <FormDescription>
                    Este correo es validado por Google y no se puede modificar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="04121234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button 
                type="submit"
                className="w-full" 
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
