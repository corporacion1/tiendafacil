
"use client";

import { useState, useMemo, useEffect } from "react";
import type { UserProfile, UserRole } from "@/lib/types";
import { MoreHorizontal, Search, UserPlus, Shield, Check, Mail, Phone, ExternalLink, UserX, Armchair, AlertTriangle, Database, Users, Crown, Store } from "lucide-react";
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
    case 'pos': return 'secondary';
    case 'user':
    default: return 'outline';
  }
};

const getRoleIcon = (role: UserProfile['role']) => {
  switch (role) {
    case 'su': return <Shield className="h-4 w-4 mr-2" />;
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
  const [actionType, setActionType] = useState<'promote' | 'disable' | 'changeRole' | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [summary, setSummary] = useState<UsersSummary | null>(null);

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
      pos: users.filter(u => u.role === 'pos').length,
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


  const handleAction = (user: UserProfile, type: 'promote' | 'disable' | 'changeRole', role?: UserRole) => {
    if (currentUserProfile?.role !== 'su') {
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
      if (!userToAction) return;

      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userToAction.uid, role: newRole }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar rol');
        }

        const updatedUser = await response.json();
        setUsers(prevUsers => prevUsers.map(u => u.uid === userToAction.uid ? updatedUser : u));
        
        toast({
            title: 'Rol Actualizado',
            description: `${userToAction.displayName} ahora es ${newRole}.`,
        });

        setUserToAction(null);
        setActionType(null);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el rol del usuario.",
        });
      }
  }

  const confirmAction = async () => {
    if (!userToAction) return;

    try {
      if (actionType === 'promote') {
        const newStoreId = `store-${userToAction.uid.slice(0, 8)}`;
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: userToAction.uid, 
            role: 'admin', 
            storeId: newStoreId, 
            storeRequest: false 
          }),
        });

        if (!response.ok) {
          throw new Error('Error al promover usuario');
        }

        const updatedUser = await response.json();
        setUsers(prevUsers => prevUsers.map(u => u.uid === userToAction.uid ? updatedUser : u));
        
        toast({
            title: "Usuario Promovido",
            description: `${userToAction.displayName} ahora es un administrador con la tienda ${newStoreId}.`,
        });

      } else if (actionType === 'disable') {
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
                                       <DropdownMenuItem onSelect={() => handleAction(user, 'changeRole', 'su')}>
                                          <Check className={`mr-2 h-4 w-4 ${user.role === 'su' ? 'opacity-100' : 'opacity-0'}`} />
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
    </ErrorBoundary>
  );
}

    