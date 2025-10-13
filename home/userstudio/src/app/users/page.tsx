
"use client";

import { useState, useMemo, useEffect } from "react";
import type { UserProfile, UserRole } from "@/lib/types";
import { MoreHorizontal, Search, UserPlus, Shield, Check, Mail, Phone, ExternalLink, UserX, Armchair, AlertTriangle, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useSettings } from "@/contexts/settings-context";
import { useCollection, useFirestore, setDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useSecurity } from "@/contexts/security-context";

const getRoleVariant = (role: UserProfile['role']) => {
  switch (role) {
    case 'superAdmin': return 'destructive';
    case 'admin': return 'default';
    case 'pos': return 'secondary';
    case 'user':
    default: return 'outline';
  }
};

const getRoleIcon = (role: UserProfile['role']) => {
  switch (role) {
    case 'superAdmin': return <Shield className="h-4 w-4 mr-2" />;
    case 'admin': return <UserPlus className="h-4 w-4 mr-2" />;
    case 'pos': return <Armchair className="h-4 w-4 mr-2" />;
    case 'user':
    default: return <UserPlus className="h-4 w-4 mr-2" />;
  }
};

const getStatusVariant = (status: UserProfile['status'] | undefined) => {
    return status === 'disabled' ? 'destructive' : 'outline';
}

export default function UsersPage() {
  const { userProfile: currentUserProfile, switchStore, activeStoreId } = useSettings();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { hasPin, checkPin } = useSecurity();
  
  const usersCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'disable' | 'changeRole' | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');


  const handleAction = (user: UserProfile, type: 'promote' | 'disable' | 'changeRole', role?: UserRole) => {
    if (currentUserProfile?.role !== 'superAdmin') {
      toast({ variant: 'destructive', title: 'Permiso denegado' });
      return;
    }
    setUserToAction(user);
    setActionType(type);
    if (role) {
      setNewRole(role);
    }
  };
  
  const confirmRoleChange = async () => {
      if (!userToAction || !firestore) return;
      
      const userDocRef = doc(firestore, 'users', userToAction.uid);
      setDocumentNonBlocking(userDocRef, { role: newRole }, { merge: true });
      
      toast({
          title: 'Rol Actualizado',
          description: `${userToAction.displayName} ahora es ${newRole}.`,
      });

      setUserToAction(null);
      setActionType(null);
  }

  const confirmAction = async () => {
    if (!userToAction || !firestore) return;

    const userDocRef = doc(firestore, 'users', userToAction.uid);

    if (actionType === 'promote') {
      const newStoreId = `store-${userToAction.uid.slice(0, 8)}`;
      setDocumentNonBlocking(userDocRef, { role: 'admin', storeId: newStoreId, storeRequest: false }, { merge: true });
      
      toast({
          title: "Usuario Promovido",
          description: `${userToAction.displayName} ahora es un administrador con la tienda ${newStoreId}.`,
      });

    } else if (actionType === 'disable') {
       const newStatus = userToAction.status === 'disabled' ? 'active' : 'disabled';
       setDocumentNonBlocking(userDocRef, { status: newStatus }, { merge: true });
       
       toast({
            title: `Usuario ${newStatus === 'disabled' ? 'Deshabilitado' : 'Habilitado'}`,
            description: `La cuenta de "${userToAction.displayName}" ha sido ${newStatus === 'disabled' ? 'deshabilitada' : 'habilitada'}.`,
        });
    }

    setUserToAction(null);
    setActionType(null);
  };
  
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u =>
      (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);
  
  const allStores = useMemo(() => {
      const stores: { id: string; name: string; }[] = [];
      if (users) {
        users.forEach(u => {
            if (u.role === 'admin' && u.storeId && u.displayName) {
                stores.push({ id: u.storeId, name: `${u.displayName}'s Store` });
            }
        });
      }
      return stores;
  }, [users]);

  if (currentUserProfile?.role !== 'superAdmin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>No tienes permisos para ver esta página.</CardDescription>
        </CardHeader>
      </Card>
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
          {!isLoading && <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Avatar</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol / Tienda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Solicitud</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid} className={user.status === 'disabled' ? 'opacity-50' : ''}>
                     <TableCell className="hidden sm:table-cell">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-muted rounded-full overflow-hidden">
                          {user.photoURL ? (
                              <Image src={user.photoURL} alt={user.displayName || 'Avatar'} fill sizes="40px" className="object-cover" />
                          ) : (
                              <Armchair className="h-5 w-5 text-muted-foreground" />
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
                        <Badge variant={getStatusVariant(user.status)}>
                            {user.status === 'disabled' ? 'Deshabilitado' : 'Activo'}
                        </Badge>
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
                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={user.uid === currentUserProfile?.uid}>
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
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem onSelect={() => handleAction(user, 'changeRole', 'user')}>
                                                <Check className={`mr-2 h-4 w-4 ${user.role === 'user' ? 'opacity-100' : 'opacity-0'}`} />
                                                User
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleAction(user, 'changeRole', 'pos')}>
                                                <Check className={`mr-2 h-4 w-4 ${user.role === 'pos' ? 'opacity-100' : 'opacity-0'}`} />
                                                Pos
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => handleAction(user, 'changeRole', 'admin')}>
                                                <Check className={`mr-2 h-4 w-4 ${user.role === 'admin' ? 'opacity-100' : 'opacity-0'}`} />
                                                Admin
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => handleAction(user, 'changeRole', 'superAdmin')}>
                                                <Check className={`mr-2 h-4 w-4 ${user.role === 'superAdmin' ? 'opacity-100' : 'opacity-0'}`} />
                                                SuperAdmin
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                {user.storeId && 
                                    <DropdownMenuItem onSelect={() => switchStore(user.storeId)}>
                                        <ExternalLink className="mr-2 h-4 w-4" /> Ver como este usuario
                                    </DropdownMenuItem>
                                }
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={() => handleAction(user, 'disable')}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    {user.status === 'disabled' ? 'Habilitar Usuario' : 'Deshabilitar Usuario'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!userToAction} onOpenChange={(isOpen) => !isOpen && setUserToAction(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar Acción?</AlertDialogTitle>
                <AlertDialogDescription>
                    {actionType === 'promote' && `Estás a punto de promover a "${userToAction?.displayName}" a administrador. Se le asignará una nueva tienda. ¿Estás seguro?`}
                    {actionType === 'disable' && `Estás a punto de ${userToAction?.status === 'disabled' ? 'habilitar' : 'deshabilitar'} la cuenta de "${userToAction?.displayName}".`}
                    {actionType === 'changeRole' && `¿Estás seguro de que quieres cambiar el rol de "${userToAction?.displayName}" a ${newRole}?`}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={actionType === 'changeRole' ? confirmRoleChange : confirmAction}>
                    Sí, confirmar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
