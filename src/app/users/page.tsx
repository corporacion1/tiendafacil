
"use client";

import { useState, useMemo, useEffect } from "react";
import type { UserProfile, UserRole } from "@/lib/types";
import { MoreHorizontal, Search, UserPlus, Shield, Check, Mail, Phone, ExternalLink, UserX, Armchair, AlertTriangle, Database, Users, Crown, Store, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useSettings } from "@/contexts/settings-context";
import { ErrorBoundary, MinimalErrorFallback } from "@/components/error-boundary";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { EditUserModal } from "@/components/edit-user-modal";
import { CreateStoreModal } from "@/components/create-store-modal";

// Interface para el resumen de usuarios
interface UsersSummary {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  adminUsers: number;
  storeRequests: number;
  byRole: {
    su: number;
    admin: number;
    pos: number;
    user: number;
  };
  recentUsers: UserProfile[];
}

const getRoleVariant = (role: UserProfile['role']) => {
  switch (role) {
    case 'su': return 'destructive';
    case 'admin': return 'default';
    case 'pos' as any: return 'secondary';
    case 'depositary' as any: return 'secondary';
    case 'user':
    default: return 'outline';
  }
};

const getRoleIcon = (role: UserProfile['role']) => {
  switch (role) {
    case 'su': return <Shield className="h-4 w-4 mr-2" />;
    case 'admin': return <UserPlus className="h-4 w-4 mr-2" />;
    case 'pos' as any: return <Armchair className="h-4 w-4 mr-2" />;
    case 'depositary' as any: return <Database className="h-4 w-4 mr-2" />;
    case 'user':
    default: return <UserPlus className="h-4 w-4 mr-2" />;
  }
};

const getStatusVariant = (status: UserProfile['status'] | undefined) => {
    return status === 'disabled' ? 'destructive' : 'outline';
}

export default function UsersPage() {
  const { 
    userProfile: currentUserProfile, 
    switchStore, 
    users, 
    setUsers, 
    isLoadingSettings: isLoading 
  } = useSettings();
  
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'disable' | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [summary, setSummary] = useState<UsersSummary | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotingUser, setPromotingUser] = useState<UserProfile | null>(null);
  const [newStoreData, setNewStoreData] = useState({
    name: '',
    generatedStoreId: ''
  });
  const [confirmationText, setConfirmationText] = useState('');
  const [switchingContext, setSwitchingContext] = useState(false);

  // Cargar todos los usuarios para administración (solo superadmin)
  useEffect(() => {
    const loadAllUsers = async () => {
      if (currentUserProfile?.role !== 'su') return;
      
      try {
        const response = await fetch('/api/users'); // Sin parámetros = todos los usuarios
        if (response.ok) {
          const allUsers = await response.json();
          setUsers(allUsers);
        }
      } catch (error) {
        handleError.api(error, {
          action: 'load_users',
          component: 'UsersPage'
        });
      }
    };

    loadAllUsers();
  }, [currentUserProfile?.role]); // Removido setUsers, toast y handleError.api de las dependencias

  // Calcular resumen de usuarios
  const calculateSummary = useMemo((): UsersSummary => {
    if (!users || users.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        disabledUsers: 0,
        adminUsers: 0,
        storeRequests: 0,
        byRole: { su: 0, admin: 0, pos: 0, user: 0 },
        recentUsers: []
      };
    }

    const activeUsers = users.filter(u => u.status !== 'disabled');
    const disabledUsers = users.filter(u => u.status === 'disabled');
    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'su');
    const storeRequests = users.filter(u => u.storeRequest);
    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 5);

    const byRole = {
      su: users.filter(u => u.role === 'su').length,
      admin: users.filter(u => u.role === 'admin').length,
      pos: users.filter(u => (u as any).role === 'pos').length,
      user: users.filter(u => u.role === 'user').length,
    };

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      disabledUsers: disabledUsers.length,
      adminUsers: adminUsers.length,
      storeRequests: storeRequests.length,
      byRole,
      recentUsers
    };
  }, [users]);

  useEffect(() => {
    setSummary(calculateSummary);
  }, [users]); // Cambiar dependencia a users en lugar de calculateSummary


  const handleAction = (user: UserProfile, type: 'promote' | 'disable') => {
    if (currentUserProfile?.role !== 'su') {
      toast({ variant: 'destructive', title: 'Permiso denegado' });
      return;
    }
    
    if (type === 'promote') {
      // Generar storeID automáticamente
      const randomDigits = Math.random().toString().slice(2, 15);
      const generatedStoreId = `ST-${randomDigits}`;
      
      setPromotingUser(user);
      setNewStoreData({
        name: `Tienda de ${user.displayName || user.email}`,
        generatedStoreId
      });
      setShowPromoteModal(true);
      return;
    }
    
    setUserToAction(user);
    setActionType(type);
  };
  


  // Función para confirmar promoción con creación de tienda
  const confirmPromoteWithStore = async () => {
    if (!promotingUser) return;

    try {
      // 1. Crear la tienda con siembra
      const createStoreResponse = await fetch('/api/stores/create-and-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreData.name,
          ownerEmail: promotingUser.email,
          businessType: 'General',
          address: '',
          phone: ''
        })
      });

      if (!createStoreResponse.ok) {
        const errorData = await createStoreResponse.json();
        throw new Error(errorData.error || 'Error al crear tienda');
      }

      const storeData = await createStoreResponse.json();
      const actualStoreId = storeData.store.storeId;

      // 2. Actualizar el usuario con el nuevo rol y storeId
      const updateUserResponse = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: promotingUser.uid, 
          role: 'admin', 
          storeId: actualStoreId,
          storeRequest: false 
        }),
      });

      if (!updateUserResponse.ok) {
        throw new Error('Error al actualizar usuario');
      }

      const updatedUser = await updateUserResponse.json();
      setUsers(prevUsers => prevUsers.map(u => u.uid === promotingUser.uid ? updatedUser.user : u));

      // 3. Cambiar el contexto activo a la nueva tienda
      await switchStore(actualStoreId);

      toast({
        title: "¡Usuario Promovido Exitosamente!",
        description: `${promotingUser.displayName} ahora es administrador de la tienda ${actualStoreId}. El contexto ha cambiado a su nueva tienda.`,
      });

      // Cerrar modal y limpiar estados
      setShowPromoteModal(false);
      setPromotingUser(null);
      setNewStoreData({
        name: '',
        generatedStoreId: ''
      });
      setConfirmationText('');

    } catch (error: any) {
      handleError.api(error, {
        action: 'promote_user_with_store',
        component: 'UsersPage'
      });
    }
  };

  const handleViewAsUser = async (user: UserProfile) => {
    if (!user.storeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El usuario no tiene una tienda asignada"
      });
      return;
    }

    try {
      setSwitchingContext(true);
      
      console.log('🔄 [Users Page] Cambiando contexto a tienda:', user.storeId);
      console.log('👤 [Users Page] Usuario objetivo:', user.displayName || user.email);
      
      // Mostrar toast de inicio
      toast({
        title: "Cambiando contexto...",
        description: `Cambiando a la tienda de ${user.displayName || user.email}`,
        duration: 2000
      });
      
      // Cambiar el contexto usando la función del contexto de settings
      await switchStore(user.storeId);
      
      // Toast de confirmación (el switchStore ya muestra uno, pero este es más específico)
      setTimeout(() => {
        toast({
          title: "✅ Contexto cambiado exitosamente",
          description: `Ahora estás viendo como ${user.displayName || user.email} en la tienda ${user.storeId}`,
          duration: 5000
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ [Users Page] Error cambiando contexto:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el contexto de usuario"
      });
    } finally {
      setSwitchingContext(false);
    }
  };

  const confirmAction = async () => {
    if (!userToAction) return;

    try {
      if (actionType === 'disable') {
        const newStatus = userToAction.status === 'disabled' ? 'active' : 'disabled';
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userToAction.uid, status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Error al cambiar estado del usuario');
        }

        const updatedUser = await response.json();
        setUsers(prevUsers => prevUsers.map(u => u.uid === userToAction.uid ? updatedUser : u));
         
        toast({
              title: `Usuario ${newStatus === 'disabled' ? 'Deshabilitado' : 'Habilitado'}`,
              description: `La cuenta de "${userToAction.displayName}" ha sido ${newStatus === 'disabled' ? 'deshabilitada' : 'habilitada'}.`,
          });
      }

      setUserToAction(null);
      setActionType(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la acción.",
      });
    }
  };
  
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(u =>
        (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone && u.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado/rol
    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'active':
          filtered = filtered.filter(u => u.status !== 'disabled');
          break;
        case 'disabled':
          filtered = filtered.filter(u => u.status === 'disabled');
          break;
        case 'admins':
          filtered = filtered.filter(u => u.role === 'admin' || u.role === 'su');
          break;
        case 'requests':
          filtered = filtered.filter(u => u.storeRequest);
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [users, searchTerm, selectedFilter]);
  
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

  const renderUsersTable = (usersToRender: UserProfile[]) => {
    if (isLoading) {
      return <div className="text-center py-8">Cargando usuarios...</div>;
    }

    if (usersToRender.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No hay usuarios</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedFilter === 'all' ? 'No se encontraron usuarios.' : `No hay usuarios ${selectedFilter === 'active' ? 'activos' : selectedFilter === 'disabled' ? 'deshabilitados' : selectedFilter === 'admins' ? 'administradores' : 'con solicitudes'}.`}
          </p>
        </div>
      );
    }

    return (
      <Table>
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
          {usersToRender.map((user) => (
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
                          <DropdownMenuItem onSelect={() => { setEditingUser(user); setShowEditModal(true); }}>
                              <UserPlus className="mr-2 h-4 w-4" /> Editar Usuario
                          </DropdownMenuItem>
                          {user.role === 'user' && user.storeRequest && (
                              <DropdownMenuItem onSelect={() => handleAction(user, 'promote')}>
                                  <Shield className="mr-2 h-4 w-4" /> Promover a Admin
                              </DropdownMenuItem>
                          )}

                          {user.storeId && 
                              <DropdownMenuItem 
                                onSelect={() => handleViewAsUser(user)}
                                disabled={switchingContext}
                              >
                                  {switchingContext ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cambiando...
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="mr-2 h-4 w-4" /> Ver como este usuario
                                    </>
                                  )}
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
      </Table>
    );
  };

  if (currentUserProfile?.role !== 'su') {
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
    <div className="w-full max-w-full overflow-x-hidden">
    <ErrorBoundary fallback={MinimalErrorFallback}>
      {/* Dashboard de métricas */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {summary.activeUsers} activos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.adminUsers}</div>
              <p className="text-xs text-muted-foreground">
                {summary.byRole.su} superadmin
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
              <Store className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.storeRequests}</div>
              <p className="text-xs text-muted-foreground">
                Quieren tienda
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deshabilitados</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.disabledUsers}</div>
              <p className="text-xs text-muted-foreground">
                Cuentas inactivas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="admins">Administradores</TabsTrigger>
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
            <TabsTrigger value="disabled">Deshabilitados</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios y sus roles en el sistema.
              {filteredUsers.length > 0 && (
                <span className="ml-2">
                  Mostrando {filteredUsers.length} de {users?.length || 0} usuarios
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsContent value="all">
              {renderUsersTable(filteredUsers)}
            </TabsContent>
            <TabsContent value="active">
              {renderUsersTable(filteredUsers.filter(u => u.status !== 'disabled'))}
            </TabsContent>
            <TabsContent value="admins">
              {renderUsersTable(filteredUsers.filter(u => u.role === 'admin' || u.role === 'su'))}
            </TabsContent>
            <TabsContent value="requests">
              {renderUsersTable(filteredUsers.filter(u => u.storeRequest))}
            </TabsContent>
            <TabsContent value="disabled">
              {renderUsersTable(filteredUsers.filter(u => u.status === 'disabled'))}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* Diálogo de confirmación de acciones */}
      <AlertDialog open={!!userToAction} onOpenChange={(isOpen) => !isOpen && setUserToAction(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar Acción?</AlertDialogTitle>
                <AlertDialogDescription>
                    {actionType === 'disable' && `Estás a punto de ${userToAction?.status === 'disabled' ? 'habilitar' : 'deshabilitar'} la cuenta de "${userToAction?.displayName}".`}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAction}>
                    Sí, confirmar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para promoción con creación de tienda */}
      <AlertDialog open={showPromoteModal} onOpenChange={setShowPromoteModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Promover a Administrador
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se creará una nueva tienda para {promotingUser?.displayName} y será promovido a administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="storeName">Nombre de la Tienda</Label>
              <Input
                id="storeName"
                value={newStoreData.name}
                onChange={(e) => setNewStoreData({...newStoreData, name: e.target.value})}
                placeholder="Nombre de la nueva tienda"
              />
            </div>
            
            <div>
              <Label>StoreID (Generado automáticamente)</Label>
              <Input
                value={newStoreData.generatedStoreId}
                disabled
                className="bg-gray-100 font-mono text-sm"
              />
            </div>
            
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800 font-medium mb-2">
                ⚠️ Confirmación requerida
              </p>
              <p className="text-xs text-amber-700 mb-3">
                Para continuar, escriba "CONFIRMAR" en el campo de abajo:
              </p>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Escriba CONFIRMAR para activar el botón"
                className="bg-white"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Proceso automático:</strong>
              </p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• Se creará la tienda con datos de muestra</li>
                <li>• El usuario será promovido a administrador</li>
                <li>• El contexto cambiará a la nueva tienda</li>
              </ul>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPromoteModal(false);
              setPromotingUser(null);
              setNewStoreData({
                name: '',
                generatedStoreId: ''
              });
              setConfirmationText('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPromoteWithStore}
              disabled={!newStoreData.name || confirmationText !== 'CONFIRMAR'}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Crown className="h-4 w-4 mr-2" />
              Crear Tienda y Promover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de edición de usuario */}
      <EditUserModal
        user={editingUser}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onUserUpdated={() => {
          // Recargar la lista de usuarios después de la actualización
          const loadAllUsers = async () => {
            if (currentUserProfile?.role !== 'su') return;
            
            try {
              const response = await fetch('/api/users');
              if (response.ok) {
                const allUsers = await response.json();
                setUsers(allUsers);
              }
            } catch (error) {
              handleError.api(error, {
                action: 'reload_users',
                component: 'UsersPage'
              });
            }
          };
          loadAllUsers();
        }}
      />
    </ErrorBoundary>
    </div>
  );
}

    