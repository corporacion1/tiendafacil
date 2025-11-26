import { supabaseAdmin } from '@/lib/supabase';

// Definir tipos
export enum MovementType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  INITIAL_STOCK = 'INITIAL_STOCK',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER'
}

export enum ReferenceType {
  SALE_TRANSACTION = 'SALE_TRANSACTION',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  PRODUCT_CREATION = 'PRODUCT_CREATION',
  TRANSFER_ORDER = 'TRANSFER_ORDER'
}

export interface InventoryMovementDocument {
  id: string;
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  unitCost: number;
  totalValue: number;
  referenceType: ReferenceType;
  referenceId: string;
  batchId?: string;
  previousStock: number;
  newStock: number;
  userId: string;
  notes?: string;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovementRequest {
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  unitCost?: number;
  referenceType: ReferenceType;
  referenceId: string;
  batchId?: string;
  userId: string;
  notes?: string;
  storeId: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
}

export interface MovementFilters {
  dateFrom?: Date;
  dateTo?: Date;
  movementTypes?: MovementType[];
  warehouseId?: string;
  userId?: string;
  batchId?: string;
}

export class MovementService {

  /**
   * Registra un movimiento de inventario
   * Se integra de forma transparente sin afectar el flujo actual
   */
  static async recordMovement(request: CreateMovementRequest): Promise<InventoryMovementDocument | null> {
    try {
      console.log('📦 [MovementService] Registrando movimiento:', {
        productId: request.productId,
        type: request.movementType,
        quantity: request.quantity
      });

      // Obtener stock actual del producto
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', request.productId)
        .eq('store_id', request.storeId)
        .single();

      if (productError || !product) {
        console.warn('⚠️ [MovementService] Producto no encontrado:', request.productId);
        return null; // No fallar, solo no registrar
      }

      // Determinar si este producto afecta inventario
      const affectsInventory = product.type === 'product' && product.affects_inventory !== false;

      // Los servicios se registran para contabilidad pero no afectan stock físico
      if (!affectsInventory) {
        console.log('🔧 [MovementService] Servicio detectado, registrando solo para contabilidad:', request.productId);

        // Crear movimiento contable sin afectar stock
        const movementData = {
          product_id: request.productId,
          warehouse_id: request.warehouseId,
          movement_type: request.movementType,
          quantity: request.quantity,
          unit_cost: request.unitCost || product.cost || 0,
          total_value: Math.abs(request.quantity) * (request.unitCost || product.cost || 0),
          reference_type: request.referenceType,
          reference_id: request.referenceId,
          batch_id: request.batchId,
          previous_stock: 0, // Servicios no tienen stock
          new_stock: 0, // Servicios no tienen stock
          user_id: request.userId,
          notes: `${request.notes} (Solo contabilidad - Servicio)`,
          store_id: request.storeId
        };

        const { data: movement, error } = await supabaseAdmin
          .from('inventory_movements')
          .insert([movementData])
          .select()
          .single();

        if (error) throw error;

        console.log('✅ [MovementService] Movimiento contable registrado para servicio:', movement.id);
        return this.mapMovement(movement);
      }

      // Para productos físicos: calcular y actualizar stock real
      const previousStock = product.stock || 0;
      const newStock = Math.max(0, previousStock + request.quantity); // No permitir stock negativo

      // Calcular valor total
      const unitCost = request.unitCost || product.cost || 0;
      const totalValue = Math.abs(request.quantity) * unitCost;

      // Crear el movimiento
      const movementData = {
        product_id: request.productId,
        warehouse_id: request.warehouseId,
        movement_type: request.movementType,
        quantity: request.quantity,
        unit_cost: unitCost,
        total_value: totalValue,
        reference_type: request.referenceType,
        reference_id: request.referenceId,
        batch_id: request.batchId,
        previous_stock: previousStock,
        new_stock: newStock,
        user_id: request.userId,
        notes: request.notes,
        store_id: request.storeId
      };

      const { data: movement, error: movementError } = await supabaseAdmin
        .from('inventory_movements')
        .insert([movementData])
        .select()
        .single();

      if (movementError) throw movementError;

      // ACTUALIZAR EL STOCK REAL DEL PRODUCTO
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', request.productId)
        .eq('store_id', request.storeId);

      if (updateError) throw updateError;

      console.log('✅ [MovementService] Movimiento registrado y stock actualizado:', {
        movementId: movement.id,
        previousStock,
        newStock,
        change: request.quantity
      });

      return this.mapMovement(movement);

    } catch (error) {
      console.error('❌ [MovementService] Error registrando movimiento:', error);
      // No lanzar error para no romper el flujo actual
      return null;
    }
  }

  /**
   * Registra múltiples movimientos en lote
   * Útil para compras y ventas con múltiples productos
   */
  static async recordBatchMovements(requests: CreateMovementRequest[]): Promise<InventoryMovementDocument[]> {
    try {
      console.log('📦 [MovementService] Registrando lote de movimientos:', requests.length);

      const movements = [];
      for (const request of requests) {
        const movement = await this.recordMovement(request);
        if (movement) {
          movements.push(movement);
        }
      }

      console.log('✅ [MovementService] Lote completado:', movements.length, 'movimientos');
      return movements;

    } catch (error) {
      console.error('❌ [MovementService] Error en lote de movimientos:', error);
      return [];
    }
  }

  /**
   * Obtiene el historial de movimientos de un producto
   */
  static async getProductMovements(
    productId: string,
    storeId: string,
    filters?: MovementFilters
  ): Promise<InventoryMovementDocument[]> {
    try {
      let query = supabaseAdmin
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .eq('store_id', storeId);

      // Aplicar filtros si se proporcionan
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      if (filters?.movementTypes?.length) {
        query = query.in('movement_type', filters.movementTypes);
      }

      if (filters?.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.batchId) {
        query = query.eq('batch_id', filters.batchId);
      }

      const { data: movements, error } = await query
        .order('created_at', { ascending: false })
        .limit(100); // Limitar para rendimiento

      if (error) throw error;

      return movements?.map(this.mapMovement) || [];

    } catch (error) {
      console.error('❌ [MovementService] Error obteniendo movimientos:', error);
      return [];
    }
  }

  /**
   * Calcula el stock de un producto en una fecha específica
   */
  static async calculateStockAtDate(
    productId: string,
    warehouseId: string,
    storeId: string,
    date: Date
  ): Promise<number> {
    try {
      const { data: movements, error } = await supabaseAdmin
        .from('inventory_movements')
        .select('quantity')
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId)
        .eq('store_id', storeId)
        .lte('created_at', date.toISOString());

      if (error) throw error;

      let stock = 0;
      movements?.forEach(m => {
        stock += m.quantity;
      });

      return Math.max(0, stock); // No permitir stock negativo

    } catch (error) {
      console.error('❌ [MovementService] Error calculando stock:', error);
      return 0;
    }
  }

  /**
   * Valida la consistencia del stock de un producto
   */
  static async validateProductStock(
    productId: string,
    warehouseId: string,
    storeId: string
  ): Promise<{
    isConsistent: boolean;
    currentStock: number;
    calculatedStock: number;
    discrepancy: number;
  }> {
    try {
      // Obtener stock actual del producto
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', productId)
        .eq('store_id', storeId)
        .single();

      if (error) throw error;

      const currentStock = product?.stock || 0;

      // Calcular stock basado en movimientos
      const calculatedStock = await this.calculateStockAtDate(
        productId,
        warehouseId,
        storeId,
        new Date()
      );

      const discrepancy = currentStock - calculatedStock;
      const isConsistent = Math.abs(discrepancy) < 0.001; // Tolerancia para decimales

      return {
        isConsistent,
        currentStock,
        calculatedStock,
        discrepancy
      };

    } catch (error) {
      console.error('❌ [MovementService] Error validando consistencia:', error);
      return {
        isConsistent: false,
        currentStock: 0,
        calculatedStock: 0,
        discrepancy: 0
      };
    }
  }

  /**
   * Genera un ID único para operaciones por lotes
   */
  static generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ========== AUTOMATIC INTEGRATION METHODS ==========

  /**
   * Registra automáticamente movimientos para una venta
   * Se llama desde el procesamiento de ventas
   */
  static async recordSaleMovements(
    saleId: string,
    saleItems: SaleItem[],
    userId: string,
    storeId: string,
    warehouseId: string = 'main'
  ): Promise<InventoryMovementDocument[]> {
    try {
      console.log('🛒 [MovementService] Registrando movimientos de venta:', saleId);

      const batchId = this.generateBatchId();
      const movements = [];

      for (const item of saleItems) {
        const movementRequest: CreateMovementRequest = {
          productId: item.productId,
          warehouseId,
          movementType: MovementType.SALE,
          quantity: -item.quantity, // Negativo para salida
          unitCost: item.price,
          referenceType: ReferenceType.SALE_TRANSACTION,
          referenceId: saleId,
          batchId,
          userId,
          notes: `Venta: ${item.productName} x${item.quantity}`,
          storeId
        };

        const movement = await this.recordMovement(movementRequest);
        if (movement) {
          movements.push(movement);
        }
      }

      console.log('✅ [MovementService] Movimientos de venta registrados:', movements.length);
      return movements;

    } catch (error) {
      console.error('❌ [MovementService] Error en movimientos de venta:', error);
      return [];
    }
  }

  /**
   * Registra automáticamente movimientos para una compra
   * Se llama desde el procesamiento de compras
   */
  static async recordPurchaseMovements(
    purchaseId: string,
    purchaseItems: PurchaseItem[],
    userId: string,
    storeId: string,
    warehouseId: string = 'main'
  ): Promise<InventoryMovementDocument[]> {
    try {
      console.log('📦 [MovementService] Registrando movimientos de compra:', purchaseId);

      const batchId = this.generateBatchId();
      const movements = [];

      for (const item of purchaseItems) {
        const movementRequest: CreateMovementRequest = {
          productId: item.productId,
          warehouseId,
          movementType: MovementType.PURCHASE,
          quantity: item.quantity, // Positivo para entrada
          unitCost: item.cost,
          referenceType: ReferenceType.PURCHASE_ORDER,
          referenceId: purchaseId,
          batchId,
          userId,
          notes: `Compra: ${item.productName} x${item.quantity}`,
          storeId
        };

        const movement = await this.recordMovement(movementRequest);
        if (movement) {
          movements.push(movement);
        }
      }

      console.log('✅ [MovementService] Movimientos de compra registrados:', movements.length);
      return movements;

    } catch (error) {
      console.error('❌ [MovementService] Error en movimientos de compra:', error);
      return [];
    }
  }

  /**
   * Registra movimiento inicial cuando se crea un producto con stock
   * Se llama desde la creación de productos
   */
  static async recordInitialStock(
    productId: string,
    productName: string,
    initialStock: number,
    unitCost: number,
    userId: string,
    storeId: string,
    warehouseId: string = 'main'
  ): Promise<InventoryMovementDocument | null> {
    try {
      if (initialStock <= 0) {
        return null; // No registrar si no hay stock inicial
      }

      console.log('🆕 [MovementService] Registrando stock inicial:', productId, initialStock);

      const movementRequest: CreateMovementRequest = {
        productId,
        warehouseId,
        movementType: MovementType.INITIAL_STOCK,
        quantity: initialStock,
        unitCost,
        referenceType: ReferenceType.PRODUCT_CREATION,
        referenceId: productId,
        userId,
        notes: `Stock inicial: ${productName}`,
        storeId
      };

      const movement = await this.recordMovement(movementRequest);
      console.log('✅ [MovementService] Stock inicial registrado');
      return movement;

    } catch (error) {
      console.error('❌ [MovementService] Error registrando stock inicial:', error);
      return null;
    }
  }

  /**
   * Registra movimiento de ajuste de inventario
   * Se llama desde ajustes manuales de inventario
   */
  static async recordInventoryAdjustment(
    productId: string,
    productName: string,
    currentStock: number,
    newStock: number,
    reason: string,
    userId: string,
    storeId: string,
    warehouseId: string = 'main'
  ): Promise<InventoryMovementDocument | null> {
    try {
      const adjustmentQuantity = newStock - currentStock;

      if (adjustmentQuantity === 0) {
        return null; // No hay cambio
      }

      console.log('🔧 [MovementService] Registrando ajuste de inventario:', productId, adjustmentQuantity);

      const movementRequest: CreateMovementRequest = {
        productId,
        warehouseId,
        movementType: MovementType.ADJUSTMENT,
        quantity: adjustmentQuantity,
        unitCost: 0, // Los ajustes no tienen costo específico
        referenceType: ReferenceType.MANUAL_ADJUSTMENT,
        referenceId: `adj_${Date.now()}`,
        userId,
        notes: `Ajuste: ${productName} - ${reason}`,
        storeId
      };

      const movement = await this.recordMovement(movementRequest);
      console.log('✅ [MovementService] Ajuste registrado');
      return movement;

    } catch (error) {
      console.error('❌ [MovementService] Error registrando ajuste:', error);
      return null;
    }
  }

  /**
   * Obtiene resumen de movimientos para un producto
   */
  static async getMovementSummary(
    productId: string,
    storeId: string,
    warehouseId: string = 'main'
  ): Promise<{
    totalIn: number;
    totalOut: number;
    currentCalculatedStock: number;
    lastMovementDate: Date | null;
    movementCount: number;
  }> {
    try {
      const { data: movements, error } = await supabaseAdmin
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .eq('warehouse_id', warehouseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let totalIn = 0;
      let totalOut = 0;
      let currentCalculatedStock = 0;
      let lastMovementDate: Date | null = null;

      movements?.forEach(movement => {
        if (movement.quantity > 0) {
          totalIn += movement.quantity;
        } else {
          totalOut += Math.abs(movement.quantity);
        }
        currentCalculatedStock += movement.quantity;
        lastMovementDate = new Date(movement.created_at);
      });

      return {
        totalIn,
        totalOut,
        currentCalculatedStock: Math.max(0, currentCalculatedStock),
        lastMovementDate,
        movementCount: movements?.length || 0
      };

    } catch (error) {
      console.error('❌ [MovementService] Error obteniendo resumen:', error);
      return {
        totalIn: 0,
        totalOut: 0,
        currentCalculatedStock: 0,
        lastMovementDate: null,
        movementCount: 0
      };
    }
  }

  private static mapMovement(data: any): InventoryMovementDocument {
    return {
      id: data.id,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      movementType: data.movement_type,
      quantity: data.quantity,
      unitCost: data.unit_cost,
      totalValue: data.total_value,
      referenceType: data.reference_type,
      referenceId: data.reference_id,
      batchId: data.batch_id,
      previousStock: data.previous_stock,
      newStock: data.new_stock,
      userId: data.user_id,
      notes: data.notes,
      storeId: data.store_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}