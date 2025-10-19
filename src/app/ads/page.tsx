
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { format, isPast, parseISO } from "date-fns";
import { MoreHorizontal, PlusCircle, Trash2, Search, Package, AlertTriangle, Eye, TrendingUp, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Ad } from "@/lib/types";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { AdForm } from "@/components/ad-form";
import { useSettings } from "@/contexts/settings-context";
import { ErrorBoundary, MinimalErrorFallback } from "@/components/error-boundary";
import { useErrorHandler } from "@/hooks/use-error-handler";

// Interface para el resumen de ADS
interface AdsSummary {
  totalAds: number;
  activeAds: number;
  expiredAds: number;
  pausedAds: number;
  inactiveAds: number;
  totalViews: number;
  averageViews: number;
  topPerformingAds: Ad[];
  expiringThisWeek: Ad[];
}

const AdRow = ({ ad, handleEdit, setAdToDelete }: {
    ad: Ad;
    handleEdit: (ad: Ad) => void;
    setAdToDelete: (ad: Ad | null) => void;
}) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = getDisplayImageUrl(ad.imageUrl);
    const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);


    const getFormattedDate = (date: any) => {
        if (!date) return 'Nunca';
        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            return format(dateObj, "dd/MM/yyyy HH:mm");
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    return (
        <TableRow className={cn(isExpired && "text-muted-foreground")}>
            <TableCell className="hidden sm:table-cell">
                <div className="relative flex items-center justify-center w-10 h-10 bg-muted rounded-md overflow-hidden isolate">
                    {imageUrl && !imageError ? (
                    <Image
                        src={imageUrl}
                        alt={ad.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        data-ai-hint={ad.imageHint}
                        onError={() => setImageError(true)}
                    />
                    ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </TableCell>
            <TableCell className="font-medium">{ad.name}</TableCell>
            <TableCell>
                {/* El badge se calculará en el componente padre */}
                <Badge variant={isExpired ? 'destructive' : ad.status === 'active' ? 'outline' : 'secondary'}>
                    {isExpired ? (
                        <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Vencido
                        </>
                    ) : ad.status === 'active' ? (
                        <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                        </>
                    ) : ad.status === 'paused' ? (
                        <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pausado
                        </>
                    ) : (
                        <>
                            <Clock className="w-3 h-3 mr-1" />
                            Inactivo
                        </>
                    )}
                </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                    {isExpired && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <span>{isClient ? getFormattedDate(ad.expiryDate) : '...'}</span>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {ad.views || 0}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                    {ad.targetBusinessTypes?.slice(0, 2).map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {type}
                        </Badge>
                    ))}
                    {ad.targetBusinessTypes && ad.targetBusinessTypes.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                            +{ad.targetBusinessTypes.length - 2}
                        </Badge>
                    )}
                </div>
            </TableCell>
             <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleEdit(ad)}>Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={() => setAdToDelete(ad)}>
                        Eliminar
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}

export default function AdsPage() {
  const { toast } = useToast();
  const { ads, setAds, isLoadingSettings: isLoading } = useSettings();
  const { handleError } = useErrorHandler();

  // Estados principales
  const [adToEdit, setAdToEdit] = useState<Ad | null>(null);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [summary, setSummary] = useState<AdsSummary | null>(null);

  // Cargar todos los ads para administración (sin filtro de businessType)
  useEffect(() => {
    const loadAllAds = async () => {
      try {
        const response = await fetch('/api/ads'); // Sin parámetros = todos los ads
        if (response.ok) {
          const allAds = await response.json();
          setAds(allAds);
        }
      } catch (error) {
        handleError.api(error, {
          action: 'load_ads',
          component: 'AdsPage'
        });
      }
    };

    loadAllAds();
  }, []); // Removido setAds y handleError de las dependencias

  // Calcular resumen de ADS
  const calculateSummary = useMemo((): AdsSummary => {
    if (!ads || ads.length === 0) {
      return {
        totalAds: 0,
        activeAds: 0,
        expiredAds: 0,
        pausedAds: 0,
        inactiveAds: 0,
        totalViews: 0,
        averageViews: 0,
        topPerformingAds: [],
        expiringThisWeek: []
      };
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const activeAds = ads.filter(ad => ad.status === 'active' && (!ad.expiryDate || !isPast(new Date(ad.expiryDate))));
    const expiredAds = ads.filter(ad => ad.expiryDate && isPast(new Date(ad.expiryDate)));
    const pausedAds = ads.filter(ad => ad.status === 'paused');
    const inactiveAds = ads.filter(ad => ad.status === 'inactive');
    const totalViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
    const topPerformingAds = [...ads].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    const expiringThisWeek = ads.filter(ad => 
      ad.expiryDate && 
      new Date(ad.expiryDate) > now && 
      new Date(ad.expiryDate) <= oneWeekFromNow
    );

    return {
      totalAds: ads.length,
      activeAds: activeAds.length,
      expiredAds: expiredAds.length,
      pausedAds: pausedAds.length,
      inactiveAds: inactiveAds.length,
      totalViews,
      averageViews: ads.length > 0 ? Math.round(totalViews / ads.length) : 0,
      topPerformingAds,
      expiringThisWeek
    };
  }, [ads]);

  useEffect(() => {
    setSummary(calculateSummary);
  }, [ads]); // Cambiar dependencia a ads en lugar de calculateSummary

  const sortedAds = useMemo(() => {
    if (!ads) return [];
    return [...ads].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ads]);

  const handleEdit = (ad: Ad) => {
    setAdToEdit(ad);
  };
  
  async function handleUpdateAd(data: Omit<Ad, 'id' | 'views' | 'createdAt'> & { id?: string }) {
    if (!data.id) return false;
    
    try {
      const response = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar anuncio');
      }

      const updatedAd = await response.json();
      setAds(prevAds => prevAds.map(ad => ad.id === data.id ? updatedAd : ad));

      toast({
        title: "Anuncio Actualizado",
        description: `El anuncio "${data.name}" ha sido actualizado.`,
      });
      setAdToEdit(null);
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el anuncio.",
      });
      return false;
    }
  }

  async function handleCreateAd(data: Omit<Ad, 'id' | 'views' | 'createdAt'>) {
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear anuncio');
      }

      const newAd = await response.json();
      setAds(prev => [newAd, ...prev]);
      
      toast({
        title: "Anuncio Creado",
        description: `El anuncio "${data.name}" ha sido creado.`,
      });
      
      setIsCreateDialogOpen(false);
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el anuncio.",
      });
      return false;
    }
  }
  
  const handleDelete = async (adId: string) => {
    try {
      const response = await fetch(`/api/ads?id=${adId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar anuncio');
      }

      setAds(prev => prev.filter(ad => ad.id !== adId));
      toast({
        title: "Anuncio Eliminado",
        description: "El anuncio ha sido eliminado.",
      });
      setAdToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el anuncio.",
      });
    }
  };

  // Funciones auxiliares
  const getAdStatus = (ad: Ad): 'active' | 'expired' | 'inactive' | 'paused' => {
    if (ad.status === 'inactive') return 'inactive';
    if (ad.status === 'paused') return 'paused';
    if (ad.expiryDate && isPast(new Date(ad.expiryDate))) return 'expired';
    return 'active';
  };

  const getStatusBadge = (ad: Ad) => {
    const status = getAdStatus(ad);
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Vencido</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pausado</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Inactivo</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getFormattedDate = (date: any) => {
    if (!date) return 'Nunca';
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, "dd/MM/yyyy HH:mm");
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Filtrar ads según criterios
  const filteredAds = useMemo(() => {
    let filtered = sortedAds || [];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(ad =>
        ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.sku && ad.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ad.description && ad.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(ad => {
        const status = getAdStatus(ad);
        return status === selectedStatus;
      });
    }

    return filtered;
  }, [sortedAds, searchTerm, selectedStatus]);
  
  const renderAdsTable = (adsToRender: Ad[]) => {
    if (isLoading) {
      return <div className="text-center py-8">Cargando anuncios...</div>;
    }

    if (adsToRender.length === 0) {
      return (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No hay anuncios</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedStatus === 'all' ? 'Comienza creando tu primer anuncio.' : `No hay anuncios ${selectedStatus === 'active' ? 'activos' : selectedStatus === 'expired' ? 'vencidos' : selectedStatus === 'paused' ? 'pausados' : 'inactivos'}.`}
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[64px] sm:table-cell">
              <span className="sr-only">Imagen</span>
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden md:table-cell">Vence</TableHead>
            <TableHead className="hidden md:table-cell">Vistas</TableHead>
            <TableHead className="hidden lg:table-cell">Tipos de Negocio</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adsToRender.map((ad) => (
            <AdRow
              key={ad.id}
              ad={ad}
              handleEdit={handleEdit}
              setAdToDelete={setAdToDelete}
            />
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <ErrorBoundary fallback={MinimalErrorFallback}>
      {/* Dashboard de métricas */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anuncios</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAds}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalViews} vistas totales
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.activeAds}</div>
              <p className="text-xs text-muted-foreground">
                {summary.averageViews} vistas promedio
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.expiredAds}</div>
              <p className="text-xs text-muted-foreground">
                {summary.expiringThisWeek.length} vencen esta semana
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pausados</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.pausedAds}</div>
              <p className="text-xs text-muted-foreground">
                {summary.inactiveAds} inactivos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="expired">Vencidas</TabsTrigger>
            <TabsTrigger value="paused">Pausadas</TabsTrigger>
            <TabsTrigger value="inactive">Inactivas</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar anuncios..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 gap-1"
              onClick={async () => {
                try {
                  const response = await fetch('/api/ads/expire', { method: 'POST' });
                  const result = await response.json();
                  toast({
                    title: "Verificación de vencimientos",
                    description: result.message,
                  });
                  // Recargar ads después de la verificación
                  const adsResponse = await fetch('/api/ads');
                  if (adsResponse.ok) {
                    const updatedAds = await adsResponse.json();
                    setAds(updatedAds);
                  }
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo verificar vencimientos",
                  });
                }
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Verificar Vencidos
              </span>
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1 bg-primary hover:bg-primary/90">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Crear Anuncio
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Anuncio</DialogTitle>
                  <DialogDescription>
                    Completa el formulario para agregar un nuevo anuncio.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto p-1">
                  <AdForm
                    onSubmit={handleCreateAd}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Gestión de Anuncios</CardTitle>
            <CardDescription>
              Crea, edita y monitorea tus campañas publicitarias.
              {filteredAds.length > 0 && (
                <span className="ml-2">
                  Mostrando {filteredAds.length} de {ads?.length || 0} anuncios
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsContent value="all">
              {renderAdsTable(filteredAds)}
            </TabsContent>
            <TabsContent value="active">
              {renderAdsTable(filteredAds.filter(ad => getAdStatus(ad) === 'active'))}
            </TabsContent>
            <TabsContent value="expired">
              {renderAdsTable(filteredAds.filter(ad => getAdStatus(ad) === 'expired'))}
            </TabsContent>
            <TabsContent value="paused">
              {renderAdsTable(filteredAds.filter(ad => getAdStatus(ad) === 'paused'))}
            </TabsContent>
            <TabsContent value="inactive">
              {renderAdsTable(filteredAds.filter(ad => getAdStatus(ad) === 'inactive'))}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>



      {/* Diálogo de edición */}
      <Dialog open={!!adToEdit} onOpenChange={(isOpen) => !isOpen && setAdToEdit(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Anuncio</DialogTitle>
            <DialogDescription>
              Modifica los detalles del anuncio y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            {adToEdit && (
              <AdForm 
                ad={adToEdit}
                onSubmit={handleUpdateAd}
                onCancel={() => setAdToEdit(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!adToDelete} onOpenChange={(isOpen) => !isOpen && setAdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Anuncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. ¿Estás seguro de que quieres eliminar "{adToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => adToDelete && handleDelete(adToDelete.id)} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorBoundary>
  );
}

    