
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { File, ListFilter, MoreHorizontal, PlusCircle, Trash2, Search, ArrowUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockProducts, mockInventoryMovements, mockSales } from "@/lib/data";
import type { Product, InventoryMovement } from "@/lib/types";
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


export default function InventoryPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [open, setOpen] = useState(false)
  const [selectedProductCombo, setSelectedProductCombo] = useState<Product | null>(null)


  const handleEdit = (product: Product) => {
    setProductToEdit(product);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    toast({
        title: "Producto Actualizado",
        description: `El producto "${updatedProduct.name}" ha sido actualizado.`,
    });
    setProductToEdit(null); // Close the dialog
  };
  
  const handleDelete = (productId: string) => {
     // Check if product is in any sale
    const isProductInSale = mockSales.some(sale => sale.items.some(item => item.productId === productId));

    if (isProductInSale) {
        toast({
            variant: "destructive",
            title: "Eliminación Bloqueada",
            description: "Este producto no se puede eliminar porque tiene ventas asociadas. Para mantener la integridad de los reportes, considere cambiar su estado a 'Inactivo'.",
        });
        return;
    }
    
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({
      title: "Producto Eliminado",
      description: "El producto ha sido eliminado del inventario.",
    });
  };

  const handleMoveInventory = () => {
    toast({
        title: "Movimiento Registrado",
        description: "El movimiento de inventario ha sido registrado exitosamente.",
    });
  };

  const productMovements = selectedProduct ? mockInventoryMovements.filter(m => m.productName === selectedProduct.name) : [];

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

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
                        <Label htmlFor="product">Producto</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                                >
                                {selectedProductCombo
                                    ? selectedProductCombo.name
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
                                                    setSelectedProductCombo(product || null);
                                                    setOpen(false)
                                                }}
                                                >
                                                <X className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedProductCombo?.id === product.id ? "opacity-100" : "opacity-0"
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
                        <Label htmlFor="type">Tipo de Movimiento</Label>
                         <Select>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="purchase">Entrada (Compra)</SelectItem>
                                <SelectItem value="sale">Salida (Venta)</SelectItem>
                                <SelectItem value="adjustment">Ajuste</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input id="quantity" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="responsable">Responsable</Label>
                        <Input id="responsable" type="text" placeholder="Nombre del responsable" required />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleMoveInventory}>Registrar Movimiento</Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
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
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={product.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={product.imageUrl}
                        width="64"
                        data-ai-hint={product.imageHint}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'outline' : 'secondary'}>
                        {product.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${product.wholesalePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <AlertDialog>
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
                               <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={() => setSelectedProduct(product)}>Ver Movimientos</DropdownMenuItem>
                              </DialogTrigger>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                  Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar Producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción es irreversible. ¿Estás seguro de que quieres eliminar "{product.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive hover:bg-destructive/90">
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                                    {productMovements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={movement.type === "sale" ? "destructive" : movement.type === "purchase" ? "secondary" : "outline"}>
                                                    {movement.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{movement.quantity}</TableCell>
                                        </TableRow>
                                    ))}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>1-{filteredProducts.length}</strong> de <strong>{products.length}</strong>{" "}
              productos
            </div>
          </CardFooter>
        </Card>
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
            {productToEdit && (
                <ProductForm 
                    product={productToEdit}
                    onSubmit={handleUpdateProduct}
                    onCancel={() => setProductToEdit(null)}
                />
            )}
        </DialogContent>
    </Dialog>

    </>
  );
}
