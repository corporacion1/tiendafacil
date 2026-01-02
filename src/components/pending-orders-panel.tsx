"use client";

import { useState, useMemo } from "react";
import { PendingOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Armchair, MapPin, RotateCcw, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

interface PendingOrdersPanelProps {
  orders: PendingOrder[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSelectOrder: (order: PendingOrder) => void;
  activeSymbol: string;
  activeRate: number;
  defaultStatus?: string;
}

export function PendingOrdersPanel({
  orders,
  isLoading,
  onRefresh,
  onSelectOrder,
  activeSymbol,
  activeRate,
  defaultStatus = "pending",
}: PendingOrdersPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "processing":
        return <Badge variant="default">Procesando</Badge>;
      case "processed":
        return <Badge variant="outline" className="bg-green-50">Completado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pedidos Pendientes</CardTitle>
            <CardDescription>
              {filteredOrders.length} de {orders.length} pedidos
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Filtros */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por ID, cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="processed">Completado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>

        {/* Lista de pedidos */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No hay pedidos que coincidan</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <button
                key={order.orderId}
                onClick={() => onSelectOrder(order)}
                className="w-full text-left p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">
                        {order.orderId}
                      </p>
                      {getStatusBadge(order.status || 'pending')}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.customerPhone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {order.deliveryMethod === "delivery" ? (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Truck className="h-3 w-3" />
                          <span className="text-xs">Entrega</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Armchair className="h-3 w-3" />
                          <span className="text-xs">Recogida</span>
                        </div>
                      )}
                      {order.latitude && order.longitude && (
                        <div className="flex items-center gap-1 text-green-600">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">Ubicación</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-semibold text-sm">
                      {activeSymbol}
                      {(order.total * activeRate).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} items
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
