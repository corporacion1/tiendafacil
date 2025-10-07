
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { File, MoreHorizontal, PlusCircle, Trash2, Search, ArrowUpDown, X, Package, Check, ImageOff, FileText, FileSpreadsheet, FileJson, Store, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Ad } from "@/lib/types";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { AdForm } from "@/components/ad-form";
import { format, isPast } from "date-fns";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc, orderBy, query, setDoc, writeBatch } from "firebase/firestore";

const AdRow = ({ ad, handleEdit, setAdToDelete }: {
    ad: Ad;
    handleEdit: (ad: Ad) => void;
    setAdToDelete: (ad: Ad | null) => void;
}) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = getDisplayImageUrl(ad.imageUrl);
    const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate)) : false;

    const getStatusVariant = (status: Ad['status']) => {
        if (isExpired) return 'secondary';
        return status === 'active' ? 'outline' : 'secondary';
    }
    
    const getStatusLabel = (status: Ad['status']) => {
        if (isExpired) return 'Vencido';
        return status === 'active' ? 'Activo' : 'Inactivo';
    }
    
    const getFormattedDate = (date: any) => {
        if (!date) return 'Nunca';
        return format(new Date(date), "dd/MM/yyyy");
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
                <Badge variant={getStatusVariant(ad.status)}>
                    {getStatusLabel(ad.status)}
                </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                    {isExpired && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <span>{getFormattedDate(ad.expiryDate)}</span>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {ad.views}
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
  const firestore = useFirestore();
  
  const adsQuery = useMemoFirebase(() => query(collection(firestore, 'ads'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: ads = [], isLoading } = useCollection<Ad>(adsQuery);

  const [adToEdit, setAdToEdit] = useState<Ad | null>(null);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    // Check for expired ads on load and update them if necessary
    const batch = writeBatch(firestore);
    let hasUpdates = false;

    ads.forEach(ad => {
        if (ad.status === 'active' && ad.expiryDate && isPast(new Date(ad.expiryDate))) {
            const adRef = doc(firestore, 'ads', ad.id);
            batch.update(adRef, { status: 'inactive' });
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        batch.commit().catch(console.error);
    }
  }, [ads, firestore]);

  const handleEdit = (ad: Ad) => {
    setAdToEdit(ad);
  };
  
  async function handleUpdateAd(data: Omit<Ad, 'id' | 'views' | 'createdAt'> & { id?: string }) {
    if (!data.id) return false;

    const adRef = doc(firestore, 'ads', data.id);
    await setDoc(adRef, data, { merge: true });

    toast({
        title: "Anuncio Actualizado",
        description: `El anuncio "${data.name}" ha sido actualizado.`,
    });
    setAdToEdit(null);
    return true;
  }

  async function handleCreateAd(data: Omit<Ad, 'id' | 'views' | 'createdAt'>) {
    const newAd: Ad = {
      ...data,
      id: `ad-${Date.now()}`,
      views: 0,
      createdAt: new Date().toISOString(),
    };

    const adRef = doc(firestore, 'ads', newAd.id);
    await setDoc(adRef, newAd);
    
    toast({
      title: "Anuncio Creado",
      description: `El anuncio "${data.name}" ha sido creado.`,
    });
    
    setIsCreateDialogOpen(false);
    return true;
  }
  
  const handleDelete = async (adId: string) => {
    const adRef = doc(firestore, 'ads', adId);
    await deleteDoc(adRef);

    toast({
      title: "Anuncio Eliminado",
      description: "El anuncio ha sido eliminado.",
    });

    setAdToDelete(null);
  };

  const filteredAds = useMemo(() => {
    return ads.filter(ad =>
      ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ad.sku && ad.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [ads, searchTerm]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Anuncios</CardTitle>
            <CardDescription>Crea, edita y monitorea tus campañas publicitarias.</CardDescription>
          </div>
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
                            allAds={ads}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
         <div className="relative w-full max-w-sm mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o SKU..."
              className="pl-8 sm:w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Cargando anuncios...</p>}
        {!isLoading && (
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
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <AdRow
                  key={ad.id}
                  ad={ad}
                  handleEdit={handleEdit}
                  setAdToDelete={setAdToDelete}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Mostrando <strong>1-{filteredAds.length}</strong> de <strong>{ads.length}</strong> anuncios
        </div>
      </CardFooter>
    </Card>

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
                        allAds={ads}
                    />
                )}
            </div>
        </DialogContent>
    </Dialog>

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
    </>
  );
}
