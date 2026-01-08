"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { File, MoreHorizontal, PlusCircle, Trash2, Search, ArrowUpDown, X, Package, Check, ImageOff, FileText, FileSpreadsheet, FileJson, Filter, Loader2, Plus, PackagePlus } from "lucide-react";
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
import { logger } from "@/lib/logger";
import { IDGenerator } from "@/lib/id-generator";
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
import * as XLSX from 'xlsx';
import { useRef } from "react";

const ProductRow = ({ product, activeSymbol, activeRate, handleEdit, handleViewMovements, setProductToDelete }: {
  product: Product;
  activeSymbol: string;
  activeRate: number;
  handleEdit: (product: Product) => void;
  handleViewMovements: (product: Product) => void;
  setProductToDelete: (product: Product | null) => void;
}) => {
  const [imageError, setImageError] = useState(false);

  const primaryImage = (product.images && product.images.length > 0)
    ? (product.images[0].thumbnailUrl || product.images[0].url)
    : product.imageUrl;

  // Reset imageError when the primary image URL changes
  useEffect(() => {
    setImageError(false);
  }, [primaryImage]);

  const imageUrl = primaryImage
    ? getDisplayImageUrl(primaryImage)
    : null;

  const getStatusVariant = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'outline';
      case 'inactive': return 'secondary';
      case 'promotion': return 'default';
      case 'hidden': return 'secondary';
      default: return 'outline';
    }
  }

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'promotion': return 'Promoción';
      case 'hidden': return 'Ocultar';
      default: return status;
    }
  }

  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell">
        <div className="relative flex items-center justify-center w-16 h-16 bg-muted rounded-lg overflow-hidden isolate shadow-sm">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              data-ai-hint={product.imageHint}
              onError={() => setImageError(true)}
            />
          ) : (
            <Package className="h-6 w-6 text-muted-foreground" />
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
  const { createWithSync, updateWithSync, deleteWithSync } = useAutoSync();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [importStats, setImportStats] = useState({ created: 0, updated: 0, errors: 0, total: 0 });
  const [importPreview, setImportPreview] = useState<any[]>([]);

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
  const [movementNotes, setMovementNotes] = useState('');
  const [isProcessingMovement, setIsProcessingMovement] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const handleEdit = async (product: Product) => {
    logger.debug('✏️ [Inventory] Editando producto:', product);

    const productId = product.id;
    const storeId = product.storeId || activeStoreId;
    if (!productId || !storeId) {
      toast({ variant: 'destructive', title: 'No se puede editar', description: `Faltan identificadores (id=${String(productId)}, storeId=${String(storeId)})` });
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}?storeId=${encodeURIComponent(storeId)}`);
      if (!res.ok) {
        const txt = await res.text();
        logger.warn('⚠️ [Inventory] Producto no encontrado al abrir modal (GET by id):', { status: res.status, txt });
        // Fallback: cargar todos y buscar localmente por id
        const listRes = await fetch(`/api/products?storeId=${encodeURIComponent(storeId)}`);
        if (listRes.ok) {
          const list = await listRes.json();
          const found = (Array.isArray(list) ? list : (list?.products || [])).find((p: any) => p.id === productId);
          if (found) {
            logger.debug('📦 [Inventory] Producto encontrado vía listado para edición:', { id: found.id, storeId: found.storeId });
            setProductToEdit(found);
            return;
          }
        }
        // Último recurso: abrir con el producto seleccionado y advertir
        toast({ variant: 'destructive', title: `Producto no encontrado`, description: txt || 'Abriendo con datos locales. Guardar/Imágenes podrían fallar.' });
        setProductToEdit({ ...(product as any), id: productId, storeId } as Product);
        return;
      }
      const fresh = await res.json();
      logger.debug('📦 [Inventory] Producto cargado para edición:', { id: fresh.id, storeId: fresh.storeId });
      setProductToEdit(fresh);
    } catch (e) {
      logger.error('❌ [Inventory] Error cargando producto para edición:', e);
      toast({ variant: 'destructive', title: 'Error de red', description: 'No se pudo cargar el producto.' });
    }
    await reloadProducts();
  };

  const handleViewMovements = (product: Product) => {
    setSelectedProduct(product);
    setProductMovements([]); // Limpiar movimientos anteriores
    setIsMovementsDialogOpen(true);
  };

  // REEMPLAZAR handleUpdateProduct EN inventory page.tsx
  const handleUpdateProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'storeId'> & { id?: string }) => {
    if (!data.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'ID del producto no válido' });
      return false;
    }

    logger.info('🔄 [Inventory] Actualizando producto:', {
      id: data.id,
      name: data.name,
      type: data.type,
      warehouse: data.warehouse // ✅ Debug específico
    });

    // 1. Validar SKU único
    if (data.sku) {
      const duplicate = products.find(p =>
        p.sku && data.sku &&
        p.sku.toLowerCase() === data.sku.toLowerCase() &&
        p.id !== data.id
      );
      if (duplicate) {
        toast({
          variant: 'destructive',
          title: 'SKU duplicado',
          description: `Ya existe un producto con SKU "${data.sku}" (${duplicate.name}).`
        });
        return false;
      }
    }

    // 2. Preparar payload CORRECTO
    const payload = {
      id: data.id,
      storeId: activeStoreId,
      name: data.name,
      sku: data.sku || '',
      description: data.description || '',
      price: data.price || 0,
      wholesalePrice: data.wholesalePrice || 0,
      cost: data.cost || 0,
      stock: data.stock || 0,
      unit: data.unit || '',
      family: data.family || '',
      warehouse: data.warehouse || null, // ✅ Asegurar null si está vacío
      type: data.type || 'product',
      status: data.status || 'active',
      images: data.images || [],
      imageUrl: data.imageUrl || '',
      imageHint: data.imageHint || '',
      primaryImageIndex: data.primaryImageIndex || 0,
      tax1: data.tax1 || false,
      tax2: data.tax2 || false,
      affectsInventory: data.type === 'service' ? false : true // ✅ Importante
    };

    logger.debug('📤 [Inventory] Payload para actualizar:', payload);

    try {
      const response = await fetch(`/api/products/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      logger.debug('📥 [Inventory] Respuesta del API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'No se pudo leer el error';
        }

        logger.error('❌ [Inventory] Error PUT:', {
          status: response.status,
          errorText,
          url: `/api/products/${data.id}`,
          payload
        });

        if (response.status === 404) {
          toast({
            variant: 'destructive',
            title: 'Producto no encontrado',
            description: 'El producto no existe en la base de datos.'
          });
        } else {
          toast({
            variant: 'destructive',
            title: `Error ${response.status}`,
            description: errorText || 'Error al actualizar producto'
          });
        }
        return false;
      }

      const updatedProduct = await response.json();
      logger.info('✅ [Inventory] Producto actualizado:', {
        name: updatedProduct.name,
        warehouse: updatedProduct.warehouse, // ✅ Verificar
        id: updatedProduct.id
      });

      // 3. ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      setProducts(prev => prev.map(p =>
        p.id === updatedProduct.id ? updatedProduct : p
      ));

      // 4. ✅ LLAMAR A reloadProducts y ESPERAR
      try {
        await reloadProducts();
        logger.debug('✅ [Inventory] Productos recargados después de actualizar');
      } catch (reloadError) {
        logger.warn('⚠️ [Inventory] Error en reloadProducts:', reloadError);
        // Continuar aunque falle reloadProducts
      }

      // 5. Cerrar diálogo
      setProductToEdit(null);
      await reloadProducts();

      toast({
        title: '✅ Producto Actualizado',
        description: `"${updatedProduct.name}" ha sido actualizado correctamente.`
      });

      return true;

    } catch (err: any) {
      logger.error('❌ [Inventory] Error de red:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: err.message || 'No se pudo conectar con el servidor.'
      });
      return false;
    }
  };

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

    try {
      setIsDeleting(true);
      const success = await deleteWithSync('/api/products', productId, {
        successMessage: "El producto ha sido eliminado exitosamente.",
        errorMessage: "No se pudo eliminar el producto. Intenta nuevamente.",
        syncType: 'products',
        updateState: (deletedId) => {
          setProducts(prev => prev.filter(p => p.id !== deletedId));
        }
      });

      if (success) {
        setProductToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const resetMovementForm = () => {
    setMovementProduct(null);
    setMovementType('');
    setMovementQuantity(0);
    setMovementResponsible('');
    setMovementNotes('');
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
        apiEndpoint = '/api/supabase/inventory/movements';
        requestBody = {
          product_id: movementProduct.id,
          new_stock: newStock,
          reason: movementNotes || movementResponsible,
          user_id: (user as any)?.id || 'system',
          store_id: activeStoreId
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
        logger.info('✅ Ajuste registrado:', result);

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
        apiEndpoint = '/api/supabase/inventory/movements';
        requestBody = {
          product_id: movementProduct.id,
          warehouse_id: movementProduct.warehouse || null,
          movement_type: movementType === 'purchase' ? 'purchase' : 'sale',
          quantity: movementType === 'purchase' ? movementQuantity : -movementQuantity,
          reference_type: 'manual_adjustment',
          reference_id: `manual_${Date.now()}`,
          user_id: (user as any)?.id || 'system',
          notes: movementNotes || `${getMovementLabel(movementType)} manual - ${movementResponsible}`,
          store_id: activeStoreId
        };

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('Error al registrar movimiento');
        }

        // El stock del producto se actualiza en backend dentro de MovementService.
        // Solo recargamos productos luego del registro del movimiento.
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
      logger.error('❌ Error procesando movimiento:', error);
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
      const response = await fetch(`/api/supabase/inventory/movements?productId=${productId}&storeId=${activeStoreId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns array directly now
        const movementsList = Array.isArray(data) ? data : (data.movements || []);

        // Map snake_case to camelCase
        const mappedMovements = movementsList.map((m: any) => ({
          _id: m.id, // Compatibilidad con key={movement._id}
          id: m.id,
          createdAt: m.created_at,
          movementType: m.movement_type,
          quantity: m.quantity,
          previousStock: m.previous_stock,
          newStock: m.new_stock,
          referenceId: m.reference_id || m.reference_type || 'N/A',
          notes: m.notes,
          productId: m.product_id,
          warehouseId: m.warehouse_id,
          userId: m.user_id,
          storeId: m.store_id
        }));

        setProductMovements(mappedMovements);
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

  // Al principio del componente, asegúrate de que products se carga
  useEffect(() => {
    console.log('📊 [Inventory] Productos en estado:', products.length);
    if (products.length === 0 && activeStoreId) {
      console.log('🔄 [Inventory] Cargando productos inicialmente...');
      reloadProducts();
    }
  }, [activeStoreId]);

  // Y en el render, usa paginatedProducts que depende de products
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

  const exportData = (format: 'csv' | 'json' | 'txt' | 'xlsx') => {
    const data = getVisibleProducts();
    if (data.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    let content = '';
    let mimeType = '';
    let fileExtension = '';

    if (format === 'xlsx') {
      const dataToExport = data.map(p => ({
        SKU: p.sku || '',
        Nombre: p.name,
        Estado: p.status === 'active' ? 'Activo' : p.status === 'inactive' ? 'Inactivo' : 'Promoción',
        'Precio Detal': parseFloat((p.price * activeRate).toFixed(2)),
        'Precio Mayor': parseFloat((p.wholesalePrice * activeRate).toFixed(2)),
        Costo: parseFloat((p.cost * activeRate).toFixed(2)),
        Stock: p.stock,
        Unidad: p.unit || '',
        Familia: p.family || '',
        Almacen: p.warehouse || '',
        Tipo: p.type === 'service' ? 'Servicio' : 'Producto',
        Descripcion: p.description || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
      XLSX.writeFile(workbook, `inventario-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: 'Exportación completada' });
      return;
    }

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
      Almacen: p.warehouse,
      Tipo: p.type === 'service' ? 'Servicio' : 'Producto',
      Descripcion: p.description || '',
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      logger.info('📂 [Inventory] Analizando archivo:', jsonData.length, 'filas');

      const parsedData: any[] = [];
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          // Normalizar datos del Excel
          const name = row['Nombre'] || row['nombre'] || row['Name'] || row['name'];
          if (!name) continue;

          const sku = (row['SKU'] || row['sku'] || '').toString();
          const price = parseFloat(row['Precio Detal'] || row['Precio'] || row['price'] || 0);
          const cost = parseFloat(row['Costo'] || row['cost'] || 0);
          const stock = parseInt(row['Stock'] || row['stock'] || 0);
          const warehouse = row['Almacen'] || row['almacen'] || row['Warehouse'] || row['warehouse'] || '';
          const family = row['Familia'] || row['familia'] || row['Family'] || row['family'] || '';
          const unit = row['Unidad'] || row['unidad'] || row['Unit'] || row['unit'] || '';
          const description = row['Descripcion'] || row['descripcion'] || row['Description'] || row['description'] || '';

          // Lógica para Tipo (Soporta String y Boolean)
          let type: 'product' | 'service' = 'product';
          const rawType = row['Tipo'] || row['tipo'] || row['Type'] || row['type'];

          if (typeof rawType === 'boolean') {
            // Boolean: true -> Producto, false -> Servicio
            type = rawType ? 'product' : 'service';
          } else if (typeof rawType === 'string') {
            const lowerType = rawType.toLowerCase();
            if (lowerType.includes('serv') || lowerType === 'service') {
              type = 'service';
            }
            // Default is product
          }

          // Buscar producto existente
          const existingProduct = products.find(p =>
            (sku && p.sku === sku) ||
            (p.name.toLowerCase() === name.toLowerCase())
          );

          const productData = {
            name,
            sku,
            price,
            cost,
            stock,
            warehouse,
            family,
            unit,
            description,
            type,
            storeId: activeStoreId
          };

          if (existingProduct) {
            updatedCount++;
            parsedData.push({ action: 'update', existingId: existingProduct.id, data: productData, original: existingProduct });
          } else {
            createdCount++;
            parsedData.push({ action: 'create', data: productData });
          }
        } catch (err) {
          console.error('Error analizando fila:', row, err);
          errorCount++;
        }
      }

      setImportPreview(parsedData);
      setImportStats({ created: createdCount, updated: updatedCount, errors: errorCount, total: parsedData.length });
      setShowImportConfirmation(true);

    } catch (error) {
      console.error('Error leyendo archivo Excel:', error);
      toast({ variant: 'destructive', title: 'Error al leer archivo', description: 'No se pudo procesar el Excel. Verifique el formato.' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processImport = async () => {
    setIsImporting(true);
    setShowImportConfirmation(false);

    let processedCount = 0;
    let errors = 0;

    for (const item of importPreview) {
      try {
        if (item.action === 'update') {
          const res = await fetch(`/api/products/${item.existingId}?storeId=${encodeURIComponent(activeStoreId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item.original, ...item.data })
          });
          if (!res.ok) errors++;
        } else {
          const newProduct = {
            ...item.data,
            id: IDGenerator.generate('product', activeStoreId),
            storeId: activeStoreId,
            createdAt: new Date().toISOString(),
            userId: (user as any)?.id || 'system',
            status: 'active',
            image_hint: 'default-product'
          };

          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
          });
          if (!res.ok) errors++;
        }
        processedCount++;
      } catch (e) {
        errors++;
        console.error("Error processing import item", e);
      }
    }

    await reloadProducts();
    toast({
      title: "Importación Completada",
      description: `Procesados: ${processedCount}, Errores: ${errors}`
    });
    setIsImporting(false);
    setImportPreview([]);
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
              <TableHead className="hidden w-[80px] sm:table-cell">
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
            {productsToRender.map((product, index) => (
              <ProductRow
                key={`${product.id || product.sku || 'product'}-${index}`}
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
            <TabsTrigger value="all" className="hover:bg-red-500 hover:text-white">Todo</TabsTrigger>
            <TabsTrigger value="active" className="hover:bg-red-500 hover:text-white">Activo</TabsTrigger>
            <TabsTrigger value="inactive" className="hover:bg-red-500 hover:text-white">Inactivo</TabsTrigger>
            <TabsTrigger value="promotion" className="hover:bg-red-500 hover:text-white">Promoción</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleImportClick} disabled={isImporting}>
              {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {isImporting ? 'Importando...' : 'Importar Excel'}
              </span>
            </Button>

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
                <DropdownMenuItem onSelect={() => exportData('xlsx')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportData('csv')}>
                  <FileText className="mr-2 h-4 w-4" />
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
                <Button size="sm" className="h-8 gap-1 bg-blue-500 hover:bg-red-600 text-white">
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
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <textarea
                      id="notes"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Notas adicionales sobre este movimiento (opcional)"
                      value={movementNotes}
                      onChange={e => setMovementNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={resetMovementForm} id="close-movement-dialog">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleMoveInventory} disabled={!isMovementFormValid || isProcessingMovement}>
                    {isProcessingMovement ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Procesando...
                      </span>
                    ) : (
                      'Registrar Movimiento'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href={`/products?storeId=${activeStoreId}`}>
              <Button size="sm" className="h-8 gap-1 bg-green-500 hover:bg-red-600 text-white">
                <PackagePlus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Agregar Inventario
                </span>
              </Button>
            </Link>

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

      <Dialog open={!!productToEdit} onOpenChange={async (isOpen) => {
        if (!isOpen) {
          setProductToEdit(null);
          await reloadProducts();
        }
      }}>
        <DialogContent className="sm:max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica los detalles del producto y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {productToEdit && (
              <>
                <div className="text-[10px] text-muted-foreground mb-1">
                  ID: {String(productToEdit?.id)} · Store: {String(productToEdit?.storeId || '')}
                </div>
                <ProductForm
                  product={productToEdit}
                  onSubmit={handleUpdateProduct}
                  onCancel={() => setProductToEdit(null)}
                />
              </>
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
            <AlertDialogAction 
              onClick={() => productToDelete && handleDelete(productToDelete.id)} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </span>
              ) : (
                'Sí, eliminar'
              )}
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".xlsx, .xls"
      />

      <AlertDialog open={showImportConfirmation} onOpenChange={setShowImportConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importación</AlertDialogTitle>
            <AlertDialogDescription>
              Se ha analizado el archivo Excel. Resumen de cambios detectados:
              <ul className="mt-2 text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">NUEVOS</span>
                  <span>{importStats.created} productos nuevos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">EXISTENTES</span>
                  <span>{importStats.updated} productos a actualizar</span>
                </li>
                {importStats.errors > 0 && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">ERRORES</span>
                    <span>{importStats.errors} filas inválidas</span>
                  </li>
                )}
              </ul>
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                ¿Desea proceder? Esta acción modificará la base de datos de forma permanente.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setImportPreview([]); setImportStats({ created: 0, updated: 0, errors: 0, total: 0 }); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processImport} disabled={isImporting} className={isImporting ? 'opacity-50 cursor-not-allowed' : ''}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {isImporting ? 'Procesando...' : 'Confirmar e Importar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}