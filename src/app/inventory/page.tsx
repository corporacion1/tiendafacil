
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { File, MoreHorizontal, PlusCircle, Trash2, Search, ArrowUpDown, X, Package, Check, ImageOff, FileText, FileSpreadsheet, FileJson } from "lucide-react";
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
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { ProductForm } from "@/components/product-form";
import { useSettings } from "@/contexts/settings-context";
import { format, parseISO } from "date-fns";
import { useCollection, useFirestore, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, doc, orderBy, query, where, writeBatch, collectionGroup } from "firebase/firestore";

const ProductRow = ({ product, activeSymbol, activeRate, handleEdit, handleViewMovements, setProductToDelete }: {
    product: Product;
    activeSymbol: string;
    activeRate: number;
    handleEdit: (product: Product) => void;
    handleViewMovements: (product: Product) => void;
    setProductToDelete: (product: Product | null) => void;
}) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = getDisplayImageUrl(product.imageUrl);

    const getStatusVariant = (status: Product['status']) => {
        switch (status) {
            case 'active': return 'outline';
            case 'inactive': return 'secondary';
            case 'promotion': return 'default'; // Or 'destructive', 'secondary', etc.
            default: return 'outline';
        }
    }
    
    const getStatusLabel = (status: Product['status']) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'inactive': return 'Inactivo';
            case 'promotion': return 'Promoción';
            default: return status;
        }
    }

    return (
        <TableRow>
            <TableCell className="hidden sm:table-cell">
                <div className="relative flex items-center justify-center w-10 h-10 bg-muted rounded-md overflow-hidden isolate">
                    {imageUrl && !imageError ? (
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        data-ai-hint={product.imageHint}
                        onError={() => setImageError(true)}
                    />
                    ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
                <Badge variant={getStatusVariant(product.status)}>
                    {getStatusLabel(product.status)}
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
}

export default function InventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { activeSymbol, activeRate, activeStoreId, userProfile } = useSettings();
  
  const isSuperAdmin = userProfile?.role === 'superAdmin';

  const productsRef = useMemo(() => {
    if (!firestore) return null;
    return isSuperAdmin
        ? query(collectionGroup(firestore, 'products'), orderBy('createdAt', 'desc'))
        : query(collection(firestore, 'products'), where('storeId', '==', activeStoreId), orderBy('createdAt', 'desc'));
  }, [firestore, activeStoreId, isSuperAdmin]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsRef);

  const salesRef = useMemo(() => {
    if (!firestore) return null;
    return isSuperAdmin
        ? query(collectionGroup(firestore, 'sales'))
        : query(collection(firestore, 'sales'), where('storeId', '==', activeStoreId));
  }, [firestore, activeStoreId, isSuperAdmin]);
  const { data: sales = [], isLoading: isLoadingSales } = useCollection<Sale>(salesRef);

  const inventoryMovementsQuery = useMemo(() => {
    if (!firestore) return null;
    return isSuperAdmin
        ? query(collectionGroup(firestore, 'inventory_movements'))
        : query(collection(firestore, 'inventory_movements'), where('storeId', '==', activeStoreId));
  }, [firestore, activeStoreId, isSuperAdmin]);
  const { data: movementsData = [], isLoading: isLoadingMovements } = useCollection<InventoryMovement>(inventoryMovementsQuery);

  const inventoryMovements = useMemo(() => {
    return (movementsData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movementsData]);

  const isLoading = isLoadingProducts || isLoadingSales || isLoadingMovements;
  
  const [isMovementsDialogOpen, setIsMovementsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false)
  
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
    if (!data.id) return false;

    const productRef = doc(firestore, 'products', data.id);
    setDocumentNonBlocking(productRef, {...data, storeId: activeStoreId}, { merge: true });

    toast({
        title: "Producto Actualizado",
        description: `El producto "${data.name}" ha sido actualizado.`,
    });
    setProductToEdit(null);
    return true;
  }
  
  const handleDelete = (productId: string) => {
    const isProductInSale = sales.some(sale => sale.items.some(item => item.productId === productId));

    if (isProductInSale) {
        toast({
            variant: "destructive",
            title: "Eliminación Bloqueada",
            description: "Este producto no se puede eliminar porque tiene ventas asociadas. Considere cambiar su estado a 'Inactivo'.",
        });
        setProductToDelete(null);
        return;
    }
    
    const productRef = doc(firestore, 'products', productId);
    deleteDocumentNonBlocking(productRef);

    toast({
        title: "Producto Eliminado",
        description: "El producto ha sido eliminado del inventario.",
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
    if (!movementProduct || !movementType || movementQuantity <= 0 || !movementResponsible.trim()) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Por favor, completa todos los campos del formulario.",
      });
      return;
    }

    let newStock: number;
    const currentStock = movementProduct.stock;
    
    switch (movementType) {
      case 'purchase': newStock = currentStock + movementQuantity; break;
      case 'sale': 
        if (currentStock < movementQuantity) {
          toast({ variant: "destructive", title: "Stock insuficiente", description: `No puedes sacar ${movementQuantity} unidades. Stock actual: ${currentStock}.`});
          return;
        }
        newStock = currentStock - movementQuantity;
        break;
      case 'adjustment': newStock = movementQuantity; break;
      default: newStock = currentStock; break;
    }
    
    const batch = writeBatch(firestore);

    const productRef = doc(firestore, "products", movementProduct.id);
    batch.update(productRef, { stock: newStock });
    
    const movementRef = doc(collection(firestore, "inventory_movements"));
    const newMovement: Omit<InventoryMovement, 'id' | 'date'> & {date: string} = {
        productName: movementProduct.name,
        type: movementType,
        quantity: movementType === 'sale' ? -movementQuantity : (movementType === 'purchase' ? movementQuantity : newStock),
        date: new Date().toISOString(),
        responsible: movementResponsible,
        storeId: activeStoreId,
    };
    batch.set(movementRef, newMovement);

    try {
        await batch.commit();
        toast({
            title: "Movimiento Registrado",
            description: `El stock de "${movementProduct.name}" ha sido actualizado a ${newStock}.`,
        });
        resetMovementForm();
    } catch (error) {
        console.error("Error moving inventory: ", error);
        toast({
            variant: "destructive",
            title: "Error al registrar movimiento",
            description: (error as Error).message,
        });
    }
  };
  
  const getMovementLabel = (type: 'sale' | 'purchase' | 'adjustment') => {
    switch (type) {
        case 'sale': return 'Salida(Descargo)';
        case 'purchase': return 'Entrada(Compra)';
        case 'adjustment': return 'Ajuste(Reemplaza Stock)';
        default: return type;
    }
  };

  const productMovements = selectedProduct ? inventoryMovements.filter(m => m.productName === selectedProduct.name) : [];

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);
  
  const getVisibleProducts = () => {
    let baseFilter = filteredProducts;
    if (activeTab === 'active') baseFilter = baseFilter.filter(p => p.status === 'active');
    if (activeTab === 'inactive') baseFilter = baseFilter.filter(p => p.status === 'inactive');
    if (activeTab === 'promotion') baseFilter = baseFilter.filter(p => p.status === 'promotion');
    return baseFilter;
  }

  const exportData = (format: 'csv' | 'json' | 'txt') => {
    const data = getVisibleProducts();
    if (data.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    let content = '';
    let mimeType = '';
    let fileExtension = '';

    const dataToExport = data.map(p => ({
        SKU: p.sku,
        Nombre: p.name,
        Estado: p.status,
        Precio_Detal: (p.price * activeRate).toFixed(2),
        Precio_Mayor: (p.wholesalePrice * activeRate).toFixed(2),
        Costo: (p.cost * activeRate).toFixed(2),
        Stock: p.stock,
        Unidad: p.unit,
        Familia: p.family,
    }));

    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0]);
      const csvRows = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
      ];
      content = csvRows.join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else if (format === 'json') {
      content = JSON.stringify(dataToExport, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else { // txt
      content = dataToExport.map(p => 
        Object.entries(p).map(([key, value]) => `${key}: ${value}`).join('\n')
      ).join('\n\n--------------------------------\n\n');
      mimeType = 'text/plain';
      fileExtension = 'txt';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario-${activeTab}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: 'Exportación completada' });
  };


  const isMovementFormValid = movementProduct && movementType && movementQuantity > 0 && movementResponsible.trim() !== '';

  const renderProductsTable = (productsToRender: Product[]) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Inventario de Productos</CardTitle>
            <CardDescription>Administra y consulta tu inventario.</CardDescription>
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
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsToRender.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  activeSymbol={activeSymbol}
                  activeRate={activeRate}
                  handleEdit={handleEdit}
                  handleViewMovements={handleViewMovements}
                  setProductToDelete={setProductToDelete}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Mostrando <strong>1-{productsToRender.length}</strong> de <strong>{(products || []).length}</strong> productos
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <>
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todo</TabsTrigger>
          <TabsTrigger value="active">Activo</TabsTrigger>
          <TabsTrigger value="inactive">Inactivo</TabsTrigger>
          <TabsTrigger value="promotion">Promoción</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Exportar
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formatos de Exportación</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => exportData('csv')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>CSV (para Excel)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportData('json')}>
                    <FileJson className="mr-2 h-4 w-4" />
                    <span>JSON (Copia de Seguridad)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportData('txt')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>TXT (Texto Plano)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                                <SelectItem value="purchase">Entrada(Compra)</SelectItem>
                                <SelectItem value="sale">Salida(Descargo)</SelectItem>
                                <SelectItem value="adjustment">Ajuste(Reemplaza Stock)</SelectItem>
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
                    <Button onClick={handleMoveInventory} disabled={!isMovementFormValid}>Registrar Movimiento</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
      <TabsContent value="all">
        {renderProductsTable(getVisibleProducts())}
      </TabsContent>
      <TabsContent value="active">
        {renderProductsTable(getVisibleProducts())}
      </TabsContent>
      <TabsContent value="inactive">
        {renderProductsTable(getVisibleProducts())}
      </TabsContent>
       <TabsContent value="promotion">
        {renderProductsTable(getVisibleProducts())}
      </TabsContent>
    </Tabs>

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
    
    <Dialog open={isMovementsDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedProduct(null); } setIsMovementsDialogOpen(isOpen); }}>
      <DialogContent className="sm:max-w-xl">
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
                      <TableHead>Responsable</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {productMovements.length > 0 ? productMovements.map((movement) => (
                      <TableRow key={movement.id}>
                          <TableCell>{movement.date ? format(parseISO(movement.date as string), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                          <TableCell>
                              <Badge variant={movement.type === "sale" ? "destructive" : movement.type === "purchase" ? "secondary" : "outline"}>
                                  {getMovementLabel(movement.type)}
                              </Badge>
                          </TableCell>
                          <TableCell>{movement.responsible || 'N/A'}</TableCell>
                          <TableCell className="text-right">{movement.quantity}</TableCell>
                      </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No hay movimientos para este producto.</TableCell>
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

    