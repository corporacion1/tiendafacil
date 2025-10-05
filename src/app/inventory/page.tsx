
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { File, MoreHorizontal, PlusCircle, Trash2, Search, ArrowUpDown, X, Package, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Product, InventoryMovement, Sale } from "@/lib/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { ProductForm } from "@/components/product-form";
import { useSettings } from "@/contexts/settings-context";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useUser } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, addDoc } from "firebase/firestore";
import { format } from "date-fns";


const getDisplayImageUrl = (imageUrl?: string) => {
    if (imageUrl && imageUrl.includes("www.dropbox.com")) {
        let url = new URL(imageUrl);
        if (url.searchParams.has('dl')) {
            url.searchParams.set('raw', '1');
            url.searchParams.delete('dl');
        } else if (!url.searchParams.has('raw')) {
            url.searchParams.append('raw', '1');
        }
        return url.toString();
    }
    return imageUrl;
};

export default function InventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, "products");
  }, [firestore, user?.uid]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollection);

  const salesCollection = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, "sales");
  }, [firestore, user?.uid]);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollection);

  const movementsCollection = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, "inventoryMovements");
  }, [firestore, user?.uid]);
  const { data: inventoryMovements, isLoading: isLoadingMovements } = useCollection<InventoryMovement>(movementsCollection);

  const { activeSymbol, activeRate } = useSettings();
  const [isMovementsDialogOpen, setIsMovementsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false)
  
  // State for the inventory movement form
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'purchase' | 'sale' | 'adjustment' | ''>('');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementResponsible, setMovementResponsible] = useState('');


  const handleEdit = (product: Product) => {
    setProductToEdit(product);
  };
  
  const handleViewMovements = (product: Product) => {
    setSelectedProduct(product);
    setIsMovementsDialogOpen(true);
  };


  function handleUpdateProduct(data: Omit<Product, 'id'> & { id?: string }) {
    if (!data.id || !firestore) return false;

    const docRef = doc(firestore, 'products', data.id);
    const updatedData = { ...data };
    delete updatedData.id;

    updateDoc(docRef, updatedData)
        .then(() => {
            toast({
                title: "Producto Actualizado",
                description: `El producto "${data.name}" ha sido actualizado.`,
            });
            setProductToEdit(null); // Close the dialog
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    // Optimistically return true to allow form to reset
    return true;
  }
  
  const handleDelete = (productId: string) => {
    const isProductInSale = (sales || []).some(sale => sale.items.some(item => item.productId === productId));

    if (isProductInSale) {
        toast({
            variant: "destructive",
            title: "Eliminación Bloqueada",
            description: "Este producto no se puede eliminar porque tiene ventas asociadas. Para mantener la integridad de los reportes, considere cambiar su estado a 'Inactivo'.",
        });
        setProductToDelete(null);
        return;
    }
    
    if (!firestore) return;
    
    const docRef = doc(firestore, 'products', productId);

    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Producto Eliminado",
          description: "El producto ha sido eliminado del inventario.",
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    setProductToDelete(null);
  };

  const resetMovementForm = () => {
      setMovementProduct(null);
      setMovementType('');
      setMovementQuantity(0);
      setMovementResponsible('');
  }

  const handleMoveInventory = async () => {
    if (!movementProduct || !movementType || movementQuantity <= 0 || !movementResponsible.trim() || !firestore) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Por favor, completa todos los campos del formulario.",
      });
      return;
    }

    const currentStock = movementProduct.stock;
    let newStock = currentStock;

    switch (movementType) {
      case 'purchase': // Entrada
        newStock += movementQuantity;
        break;
      case 'sale': // Salida
        if (currentStock < movementQuantity) {
          toast({
            variant: "destructive",
            title: "Stock insuficiente",
            description: `No puedes sacar ${movementQuantity} unidades. Stock actual: ${currentStock}.`,
          });
          return;
        }
        newStock -= movementQuantity;
        break;
      case 'adjustment': // Ajuste (puede ser positivo o negativo, aquí lo manejamos como un reemplazo)
        newStock = movementQuantity;
        break;
    }
    
    const productDocRef = doc(firestore, 'products', movementProduct.id);
    const movementColRef = collection(firestore, 'inventoryMovements');

    const newMovement: Omit<InventoryMovement, 'id'> = {
        productName: movementProduct.name,
        type: movementType,
        quantity: movementType === 'sale' ? -movementQuantity : movementQuantity,
        date: serverTimestamp(),
        responsible: movementResponsible,
    };

    try {
        const batch = writeBatch(firestore);
        batch.update(productDocRef, { stock: newStock });
        batch.set(doc(movementColRef), newMovement);
        await batch.commit();

        toast({
            title: "Movimiento Registrado",
            description: `El stock de "${movementProduct.name}" ha sido actualizado a ${newStock}.`,
        });
        
        resetMovementForm();
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
          path: productDocRef.path, // Or movementColRef.path, depending on which fails
          operation: 'update',
          requestResourceData: { stock: newStock },
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };
  
  const getMovementLabel = (type: 'sale' | 'purchase' | 'adjustment') => {
    switch (type) {
        case 'sale': return 'Salida';
        case 'purchase': return 'Entrada';
        case 'adjustment': return 'Ajuste';
        default: return type;
    }
  };

  const productMovements = selectedProduct ? (inventoryMovements || []).filter(m => m.productName === selectedProduct.name) : [];

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const isMovementFormValid = movementProduct && movementType && movementQuantity > 0 && movementResponsible.trim() !== '';
  const isLoading = isLoadingProducts || isLoadingSales || isLoadingMovements;

  return (
    <>
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todo</TabsTrigger>
          <TabsTrigger value="active">Activo</TabsTrigger>
          <TabsTrigger value="inactive">Inactivo</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1 bg-accent hover:bg-accent/90">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Mover Inventario
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mover Inventario</DialogTitle>
                    <DialogDescription>
                        Registra una entrada o salida de stock para un producto.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="product">Producto *</Label>
                        <Popover open={isProductComboboxOpen} onOpenChange={setIsProductComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isProductComboboxOpen}
                                className="w-full justify-between"
                                >
                                {movementProduct
                                    ? movementProduct.name
                                    : "Selecciona un producto..."}
                                <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar producto..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                        <CommandGroup>
                                            {(products || []).map((product) => (
                                                <CommandItem
                                                key={product.id}
                                                value={product.name}
                                                onSelect={(currentValue) => {
                                                    const product = (products || []).find(p => p.name.toLowerCase() === currentValue.toLowerCase());
                                                    setMovementProduct(product || null);
                                                    setIsProductComboboxOpen(false)
                                                }}
                                                >
                                                <Check className={cn(
                                                    "mr-2 h-4 w-4",
                                                    movementProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                                )} />
                                                {product.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Movimiento *</Label>
                         <Select value={movementType} onValueChange={(value: 'purchase' | 'sale' | 'adjustment') => setMovementType(value)}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="purchase">Entrada (Compra)</SelectItem>
                                <SelectItem value="sale">Salida (Venta)</SelectItem>
                                <SelectItem value="adjustment">Ajuste (Reemplaza stock)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad *</Label>
                        <Input id="quantity" type="number" placeholder="0" value={movementQuantity || ''} onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="responsable">Responsable *</Label>
                        <Input id="responsable" type="text" placeholder="Nombre del responsable" value={movementResponsible} onChange={e => setMovementResponsible(e.target.value)} required />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={resetMovementForm}>Cancelar</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleMoveInventory} disabled={!isMovementFormValid}>Registrar Movimiento</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Inventario de Productos</CardTitle>
                    <CardDescription>
                    Administra y consulta tu inventario.
                    </CardDescription>
                </div>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    type="search"
                    placeholder="Buscar por nombre o SKU..."
                    className="pl-8 sm:w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <p>Cargando productos...</p>}
            {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[64px] sm:table-cell">
                    <span className="sr-only">Imagen</span>
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Precio Detal</TableHead>
                  <TableHead className="hidden md:table-cell">Precio Mayor</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Stock
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const displayImageUrl = getDisplayImageUrl(product.imageUrl);
                  return (
                    <TableRow key={product.id}>
                        <TableCell className="hidden sm:table-cell">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-muted rounded-md overflow-hidden isolate">
                            {displayImageUrl ? (
                            <Image
                                src={displayImageUrl}
                                alt={product.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                                data-ai-hint={product.imageHint}
                            />
                            ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                        <Badge variant={product.status === 'active' ? 'outline' : 'secondary'}>
                            {product.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        {activeSymbol}{(product.price * activeRate).toFixed(2)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        {activeSymbol}{(product.wholesalePrice * activeRate).toFixed(2)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        {product.stock}
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
                            <DropdownMenuItem onSelect={() => handleEdit(product)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleViewMovements(product)}>Ver Movimientos</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => setProductToDelete(product)}>
                                Eliminar
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>1-{filteredProducts.length}</strong> de <strong>{products?.length || 0}</strong>{" "}
              productos
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Edit Product Dialog */}
    <AlertDialog>
      <Dialog open={!!productToEdit} onOpenChange={(isOpen) => !isOpen && setProductToEdit(null)}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Editar Producto</DialogTitle>
                  <DialogDescription>
                      Modifica los detalles del producto y guarda los cambios.
                  </DialogDescription>
              </DialogHeader>
              <div className="max-h-[80vh] overflow-y-auto p-1">
                  {productToEdit && (
                      <ProductForm 
                          product={productToEdit}
                          onSubmit={handleUpdateProduct}
                          onCancel={() => setProductToEdit(null)}
                      />
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </AlertDialog>


    {/* Delete Product Alert */}
    <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Producto?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción es irreversible. ¿Estás seguro de que quieres eliminar "{productToDelete?.name}"?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => productToDelete && handleDelete(productToDelete.id)} className="bg-destructive hover:bg-destructive/90">
                Sí, eliminar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    {/* Movements Dialog */}
    <Dialog open={isMovementsDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedProduct(null); } setIsMovementsDialogOpen(isOpen); }}>
      <DialogContent className="sm:max-w-lg">
          <DialogHeader>
              <DialogTitle>Movimientos de: {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
              Un historial de todas las entradas y salidas de este producto.
              </DialogDescription>
          </DialogHeader>
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {productMovements.length > 0 ? productMovements.map((movement) => (
                      <TableRow key={movement.id}>
                          <TableCell>{movement.date ? format(movement.date.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                          <TableCell>
                              <Badge variant={movement.type === "sale" ? "destructive" : movement.type === "purchase" ? "secondary" : "outline"}>
                                  {getMovementLabel(movement.type)}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">{movement.quantity}</TableCell>
                      </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No hay movimientos para este producto.</TableCell>
                    </TableRow>
                  )}
              </TableBody>
          </Table>
            <DialogFooter>
              <DialogClose asChild>
              <Button type="button" variant="secondary">
                  Cerrar
              </Button>
              </DialogClose>
          </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

    