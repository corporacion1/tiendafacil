
"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, writeBatch, query, orderBy, setDoc } from "firebase/firestore";
import type { UserProfile, Store } from "@/lib/types";
import { MoreHorizontal, Search, UserPlus, Shield, Check, Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSettings } from "@/contexts/settings-context";

const getRoleVariant = (role: UserProfile['role']) => {
  switch (role) {
    case 'superAdmin': return 'destructive';
    case 'admin': return 'default';
    case 'user':
    default: return 'secondary';
  }
};

const getRoleIcon = (role: UserProfile['role']) => {
  switch (role) {
    case 'superAdmin': return <Shield className="h-4 w-4 mr-2" />;
    case 'admin': return <UserPlus className="h-4 w-4 mr-2" />;
    case 'user':
    default: return <UserPlus className="h-4 w-4 mr-2" />;
  }
};

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { switchStore, activeStoreId } = useSettings();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: users = [], isLoading } = useCollection<UserProfile>(usersQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'delete' | null>(null);

  useEffect(() => {
    // This is a protected route, only for superAdmin
    if (currentUser && currentUser.email !== "corporacion1@gmail.com") {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const handleAction = (user: UserProfile, type: 'promote' | 'delete') => {
    setUserToAction(user);
    setActionType(type);
  };

  const confirmAction = async () => {
    if (!userToAction || !actionType || !firestore) return;

    if (actionType === 'promote') {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', userToAction.uid);
      
      const newStoreId = `store-${userToAction.uid.slice(0, 8)}`;
      batch.update(userRef, { 
          role: 'admin',
          storeId: newStoreId,
          storeRequest: false, // Reset the request flag
      });

      // Create a store document
      const storeRef = doc(firestore, 'stores', newStoreId);
      const newStore: Store = {
        id: newStoreId,
        name: `${userToAction.displayName}'s Store`,
        ownerId: userToAction.uid,
        status: 'active',
        businessType: 'Otro', // Default business type
      };
      batch.set(storeRef, newStore);
      
      try {
        await batch.commit();
        toast({
          title: "Usuario Promovido",
          description: `${userToAction.displayName} ahora es un administrador con la tienda ${newStoreId}.`,
        });
      } catch (error) {
        console.error("Error promoting user: ", error);
        toast({ variant: 'destructive', title: "Error al promover usuario" });
      }

    } else if (actionType === 'delete') {
      // Deleting users is complex due to Firebase Auth.
      // For now, we will just mark them as 'inactive' or similar.
      // This is a placeholder for a more complex backend function.
       toast({
        variant: 'destructive',
        title: "Función no implementada",
        description: "La eliminación de usuarios debe hacerse desde una función de backend o la consola de Firebase.",
      });
    }

    setUserToAction(null);
    setActionType(null);
  };

  const filteredUsers = useMemo(() => {
    return (users || []).filter(u =>
      (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);
  
  const allStores = useMemo(() => {
      const stores: { id: string; name: string; }[] = [{ id: 'tiendafacil', name: 'Tienda Facil DEMO' }];
      (users || []).forEach(u => {
          if (u.role === 'admin' && u.storeId && u.displayName) {
              stores.push({ id: u.storeId, name: `${u.displayName}'s Store` });
          }
      });
      return stores;
  }, [users]);

  if (!currentUser || currentUser.email !== "corporacion1@gmail.com") {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Administra los usuarios y sus roles en el sistema.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">Viendo como:</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            {allStores.find(s => s.id === activeStoreId)?.name || 'Seleccionar Tienda'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {allStores.map(store => (
                             <DropdownMenuItem key={store.id} onSelect={() => switchStore(store.id)}>
                                <Check className={`mr-2 h-4 w-4 ${activeStoreId === store.id ? 'opacity-100' : 'opacity-0'}`} />
                                {store.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
          <div className="relative w-full max-w-sm mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o correo..."
              className="pl-8 sm:w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Cargando usuarios...</p>}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Avatar</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol / Tienda</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Solicitud</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                     <TableCell className="hidden sm:table-cell">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-muted rounded-full overflow-hidden">
                          {user.photoURL ? (
                              <Image src={user.photoURL} alt={user.displayName || 'Avatar'} fill sizes="40px" className="object-cover" />
                          ) : (
                              <UserPlus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.role)}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                      {user.storeId && user.role === 'admin' && (
                        <div className="text-xs text-muted-foreground mt-1">{user.storeId}</div>
                      )}
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                            {user.email && <a href={`mailto:${user.email}`} className="flex items-center gap-1 text-xs hover:underline"><Mail className="h-3 w-3" /> {user.email}</a>}
                            {user.phone && <a href={`tel:${user.phone}`} className="flex items-center gap-1 text-xs hover:underline"><Phone className="h-3 w-3" /> {user.phone}</a>}
                        </div>
                    </TableCell>
                    <TableCell>
                      {user.storeRequest && (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          ¡Quiere una tienda!
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                {user.role === 'user' && user.storeRequest && (
                                    <DropdownMenuItem onSelect={() => handleAction(user, 'promote')}>
                                        <Shield className="mr-2 h-4 w-4" /> Promover a Admin
                                    </DropdownMenuItem>
                                )}
                                {user.storeId && 
                                    <DropdownMenuItem onSelect={() => switchStore(user.storeId)}>
                                        <ExternalLink className="mr-2 h-4 w-4" /> Ver como este usuario
                                    </DropdownMenuItem>
                                }
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={() => handleAction(user, 'delete')}>
                                    Eliminar Usuario
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!userToAction} onOpenChange={(isOpen) => !isOpen && setUserToAction(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar Acción?</AlertDialogTitle>
                <AlertDialogDescription>
                    {actionType === 'promote' && `Estás a punto de promover a "${userToAction?.displayName}" a administrador. Se le asignará una nueva tienda. ¿Estás seguro?`}
                    {actionType === 'delete' && `Esta acción es irreversible y podría tener consecuencias. ¿Estás seguro de que quieres eliminar a "${userToAction?.displayName}"?`}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAction}>Sí, confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    