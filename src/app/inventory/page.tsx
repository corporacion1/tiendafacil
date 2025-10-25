
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { File, MoreHorizontal, PlusCircle, Trash2, Search, ArrowUpDown, X, Package, Check, ImageOff, FileText, FileSpreadsheet, FileJson, Filter } from "lucide-react";
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
import { RouteGuard } from "@/components/route-guard";
import { usePermissions } from "@/hooks/use-permissions";
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
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { format, parseISO } from "date-fns";
import { Pagination } from "@/components/ui/pagination";

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
      case 'promotion': return 'default';
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
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{product.name}</span>
          <Badge variant={product.type === 'service' ? 'secondary' : 'outline'} className="text-xs">
            {product.type === 'service' ? '🔧 Servicio' : '🛍️ Producto'}
          </Badge>
        </div>
      </TableCell>
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
        {product.type === 'service' ? (
          <span className="text-muted-foreground">N/A</span>
        ) : (
          product.stock
        )}
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
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const { activeSymbol, activeRate, activeStoreId, products, setProducts, sales, reloadProducts } = useSettings();
  const { user } = useAuth();
  const { updateWithSync, deleteWithSync } = useAutoSync();

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);

  const [isMovementsDialogOpen, setIsMovementsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false)

  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'purchase' | 'sale' | 'adjustment' | ''>('');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementResponsible, setMovementResponsible] = useState('');
  const [isProcessingMovement, setIsProcessingMovement] = useState(false);


  const handleEdit = (product: Product) => {
    console.log('✏️ [Inventory] Editando producto:', product);
    console.log('📦 [Inventory] Producto tiene storeId:', product.storeId);
    setProductToEdit(product);
  };

  const handleViewMovements = (product: Product) => {
    setSelectedProduct(product);
    setProductMovements([]); // Limpiar movimientos anteriores
    setIsMovementsDialogOpen(true);
  };

  async function handleUpdateProduct(data: Omit<Product, 'id' | 'createdAt' | 'storeId'> & { id?: string }) {
    if (!data.id) return false;

    const result = await updateWithSync<Product>('/api/products', data, {
      successMessage: `El producto "${data.name}" ha sido actualizado exitosamente.`,
      errorMessage: "No se pudo actualizar el producto. Intenta nuevamente.",
      syncType: 'products',
      updateState: (updatedProduct) => {
        // Actualizar el producto específico en el estado local
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      }
    });

    if (result) {
      setProductToEdit(null);
      return true;
    }
    return false;
  }

  const handleDelete = async (productId: string) => {
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

    const success = await deleteWithSync('/api/products', productId, {
      successMessage: "El producto ha sido eliminado exitosamente.",
      errorMessage: "No se pudo eliminar el producto. Intenta nuevamente.",
      syncType: 'products',
      updateState: (deletedId) => {
        // Remover el producto del estado local
        setProducts(prev => prev.filter(p => p.id !== deletedId));
      }
    });

    if (success) {
      setProductToDelete(null);
    }
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

    if (isProcessingMovement) return;
    setIsProcessingMovement(true);

    try {
      const currentStock = movementProduct.stock;
      let newStock: number;
      let apiEndpoint = '';
      let requestBody: any = {};

      // Determinar el tipo de operación y preparar la solicitud
      if (movementType === 'adjustment') {
        // Para ajustes, usar la API PUT que registra automáticamente el movimiento
        newStock = movementQuantity;
        apiEndpoint = '/api/inventory/movements';
        requestBody = {
          productId: movementProduct.id,
          newStock: newStock,
          reason: movementResponsible,
          userId: (user as any)?.id || 'system',
          storeId: activeStoreId
        };

        const response = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('Error al registrar ajuste de inventario');
        }

        const result = await response.json();
        console.log('✅ Ajuste registrado:', result);

      } else {
        // Para compras y ventas, usar la API POST de movimientos
        switch (movementType) {
          case 'purchase':
            newStock = currentStock + movementQuantity;
            break;
          case 'sale':
            if (currentStock < movementQuantity) {
              toast({
                variant: "destructive",
                title: "Stock insuficiente",
                description: `No puedes sacar ${movementQuantity} unidades. Stock actual: ${currentStock}.`
              });
              return;
            }
            newStock = currentStock - movementQuantity;
            break;
          default:
            newStock = currentStock;
            break;
        }

        // Registrar movimiento manual
        apiEndpoint = '/api/inventory/movements';
        requestBody = {
          productId: movementProduct.id,
          warehouseId: 'wh-1',
          movementType: movementType === 'purchase' ? 'purchase' : 'sale',
          quantity: movementType === 'purchase' ? movementQuantity : -movementQuantity,
          referenceType: 'manual_adjustment',
          referenceId: `manual_${Date.now()}`,
          userId: (user as any)?.id || 'system',
          notes: `${getMovementLabel(movementType)} manual - ${movementResponsible}`,
          storeId: activeStoreId
        };

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('Error al registrar movimiento');
        }

        // Actualizar stock del producto
        const updateResponse = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...movementProduct,
            stock: newStock
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Error al actualizar stock del producto');
        }
      }

      // Recargar productos desde la base de datos
      await reloadProducts();

      toast({
        title: "Movimiento Registrado",
        description: `El stock de "${movementProduct.name}" ha sido actualizado a ${newStock}.`,
      });

      resetMovementForm();
      const closeButton = document.getElementById('close-movement-dialog');
      if (closeButton) closeButton.click();

    } catch (error) {
      console.error('❌ Error procesando movimiento:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar movimiento",
        description: "No se pudo registrar el movimiento. Intenta nuevamente."
      });
    } finally {
      setIsProcessingMovement(false);
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'Salida(Descargo)';
      case 'purchase': return 'Entrada(Compra)';
      case 'adjustment': return 'Ajuste(Reemplaza Stock)';
      case 'initial_stock': return 'Stock Inicial';
      case 'transfer_in': return 'Transferencia Entrada';
      case 'transfer_out': return 'Transferencia Salida';
      case 'return': return 'Devolución';
      case 'damage': return 'Daño/Pérdida';
      case 'expiry': return 'Vencimiento';
      default: return type;
    }
  };

  const getMovementVariant = (type: string) => {
    switch (type) {
      case 'sale':
      case 'transfer_out':
      case 'damage':
      case 'expiry':
        return 'destructive';
      case 'purchase':
      case 'initial_stock':
      case 'transfer_in':
      case 'return':
        return 'secondary';
      case 'adjustment':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const [productMovements, setProductMovements] = useState<any[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Cargar movimientos cuando se selecciona un producto
  useEffect(() => {
    if (selectedProduct && isMovementsDialogOpen) {
      loadProductMovements(selectedProduct.id);
    }
  }, [selectedProduct, isMovementsDialogOpen]);

  const loadProductMovements = async (productId: string) => {
    setIsLoadingMovements(true);
    try {
      const response = await fetch(`/api/inventory/movements?productId=${productId}&storeId=${activeStoreId}`);
      if (response.ok) {
        const data = await response.json();
        setProductMovements(data.movements || []);
      } else {
        console.error('Error cargando movimientos');
        setProductMovements([]);
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      setProductMovements([]);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtrar por tipo de producto
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(product => product.type === productTypeFilter);
    }

    return filtered;
  }, [products, searchTerm, productTypeFilter]);

  const getVisibleProducts = () => {
    let baseFilter = filteredProducts;
    if (activeTab === 'active') baseFilter = baseFilter.filter(p => p.status === 'active');
    if (activeTab === 'inactive') baseFilter = baseFilter.filter(p => p.status === 'inactive');
    if (activeTab === 'promotion') baseFilter = baseFilter.filter(p => p.status === 'promotion');
    return baseFilter;
  }

  // Paginación
  const paginatedProducts = useMemo(() => {
    const visibleProducts = getVisibleProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return visibleProducts.slice(startIndex, endIndex);
  }, [filteredProducts, activeTab, currentPage, itemsPerPage, productTypeFilter]);

  const totalPages = Math.ceil(getVisibleProducts().length / itemsPerPage);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, productTypeFilter]);

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
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventario de Productos</CardTitle>
              <CardDescription>Administra y consulta tu inventario.</CardDescription>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o SKU..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={productTypeFilter} onValueChange={(value: 'all' | 'product' | 'service') => setProductTypeFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="product">🛍️ Solo Productos</SelectItem>
                  <SelectItem value="service">🔧 Solo Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={getVisibleProducts().length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </CardFooter>
    </Card>
  );

  // Verificar permisos de acceso al inventario
  if (!hasPermission('canViewInventory')) {
    return (
      <RouteGuard>
        <div></div>
      </RouteGuard>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex items-center flex-wrap gap-2">
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
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={(currentValue) => {
                                    const product = products.find(p => p.name.toLowerCase() === currentValue.toLowerCase());
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
                    <Button variant="outline" onClick={resetMovementForm} id="close-movement-dialog">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleMoveInventory} disabled={!isMovementFormValid || isProcessingMovement}>
                    {isProcessingMovement ? 'Procesando...' : 'Registrar Movimiento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </div>
        <TabsContent value="all">
          {renderProductsTable(paginatedProducts)}
        </TabsContent>
        <TabsContent value="active">
          {renderProductsTable(paginatedProducts)}
        </TabsContent>
        <TabsContent value="inactive">
          {renderProductsTable(paginatedProducts)}
        </TabsContent>
        <TabsContent value="promotion">
          {renderProductsTable(paginatedProducts)}
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

      <Dialog open={isMovementsDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedProduct(null); setProductMovements([]); } setIsMovementsDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Movimientos de: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Historial completo de entradas y salidas de este producto.
            </DialogDescription>
          </DialogHeader>

          {/* Resumen de movimientos */}
          {selectedProduct && productMovements.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{productMovements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Entradas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {productMovements.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Salidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedProduct.stock}
                </div>
                <div className="text-sm text-muted-foreground">Stock Actual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {productMovements.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Movimientos</div>
              </div>
            </div>
          )}
          {isLoadingMovements ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <span className="text-sm text-muted-foreground">Cargando movimientos...</span>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Stock Anterior</TableHead>
                  <TableHead>Stock Nuevo</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productMovements.length > 0 ? productMovements.map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell className="text-sm">
                      {movement.createdAt ? format(parseISO(movement.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMovementVariant(movement.movementType)}>
                        {getMovementLabel(movement.movementType)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {movement.previousStock}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.newStock}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.referenceId || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {movement.notes || 'Sin notas'}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {isLoadingMovements ? 'Cargando...' : 'No hay movimientos para este producto.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
