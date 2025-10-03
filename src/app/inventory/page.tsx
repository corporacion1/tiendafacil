
"use client";

import { useState } from "react";
import Image from "next/image";
import { File, ListFilter, MoreHorizontal, PlusCircle, Trash2, ArrowUpDown, X } from "lucide-react";
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
import { mockProducts, mockInventoryMovements } from "@/lib/data";
import type { Product, InventoryMovement } from "@/lib/types";

export default function InventoryPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    toast({
      title: "Función no implementada",
      description: `La edición para "${product.name}" estará disponible pronto.`,
    });
  };

  const handleDelete = (productId: string) => {
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

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todo</TabsTrigger>
          <TabsTrigger value="active">Activo</TabsTrigger>
          <TabsTrigger value="inactive">Inactivo</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filtro
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Activo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Inactivo</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                        <Select>
                            <SelectTrigger id="product">
                                <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
            <CardTitle>Inventario de Productos</CardTitle>
            <CardDescription>
              Administra y consulta tu inventario.
            </CardDescription>
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
                {products.map((product) => (
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
              Mostrando <strong>1-10</strong> de <strong>{products.length}</strong>{" "}
              productos
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

    