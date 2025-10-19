import { InventoryMovement, MovementType, ReferenceType } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

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
  static async recordMovement(request: CreateMovementRequest): Promise<InventoryMovement | null> {
    try {
      console.log('📦 [MovementService] Registrando movimiento:', {
        productId: request.productId,
        type: request.movementType,
        quantity: request.quantity
      });

      // Obtener stock actual del producto
      const product = await Product.findOne({ 
        id: request.productId, 
        storeId: request.storeId 
      });

      if (!product) {
        console.warn('⚠️ [MovementService] Producto no encontrado:', request.productId);
        return null; // No fallar, solo no registrar
      }

      // Calcular stock anterior y nuevo
      const previousStock = product.stock || 0;
      const newStock = previousStock + request.quantity;

      // Calcular valor total
      const unitCost = request.unitCost || product.cost || 0;
      const totalValue = Math.abs(request.quantity) * unitCost;

      // Crear el movimiento
      const movement = await InventoryMovement.create({
        productId: request.productId,
        warehouseId: request.warehouseId,
        movementType: request.movementType,
        quantity: request.quantity,
        unitCost: unitCost,
        totalValue: totalValue,
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        batchId: request.batchId,
        previousStock: previousStock,
        newStock: newStock,
        userId: request.userId,
        notes: request.notes,
        storeId: request.storeId
      });

      console.log('✅ [MovementService] Movimiento registrado:', movement._id);
      return movement;

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
  static async recordBatchMovements(requests: CreateMovementRequest[]): Promise<InventoryMovement[]> {
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
  ): Promise<InventoryMovement[]> {
    try {
      const query: Record<string, unknown> = { productId, storeId };

      // Aplicar filtros si se proporcionan
      if (filters?.dateFrom || filters?.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
        if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
      }

      if (filters?.movementTypes?.length) {
        query.movementType = { $in: filters.movementTypes };
      }

      if (filters?.warehouseId) {
        query.warehouseId = filters.warehouseId;
      }

      if (filters?.userId) {
        query.userId = filters.userId;
      }

      if (filters?.batchId) {
        query.batchId = filters.batchId;
      }

      const movements = await InventoryMovement.find(query)
        .sort({ createdAt: -1 })
        .limit(100) // Limitar para rendimiento
        .lean();

      return movements;

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
      const movements = await InventoryMovement.find({
        productId,
        warehouseId,
        storeId,
        createdAt: { $lte: date }
      }).sort({ createdAt: 1 });

      let stock = 0;
      for (const movement of movements) {
        stock += movement.quantity;
      }

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
      const product = await Product.findOne({ 
        id: productId, 
        storeId 
      });

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
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  ): Promise<InventoryMovement[]> {
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
  ): Promise<InventoryMovement[]> {
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
  ): Promise<InventoryMovement | null> {
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
  ): Promise<InventoryMovement | null> {
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
      const movements = await InventoryMovement.find({
        productId,
        storeId,
        warehouseId
      }).sort({ createdAt: 1 });

      let totalIn = 0;
      let totalOut = 0;
      let currentCalculatedStock = 0;
      let lastMovementDate: Date | null = null;

      for (const movement of movements) {
        if (movement.quantity > 0) {
          totalIn += movement.quantity;
        } else {
          totalOut += Math.abs(movement.quantity);
        }
        currentCalculatedStock += movement.quantity;
        lastMovementDate = movement.createdAt;
      }

      return {
        totalIn,
        totalOut,
        currentCalculatedStock: Math.max(0, currentCalculatedStock),
        lastMovementDate,
        movementCount: movements.length
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
}