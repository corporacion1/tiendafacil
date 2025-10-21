# Design Document

## Overview

Este diseño implementa un sistema robusto de identificadores únicos para una aplicación multitienda, garantizando aislamiento completo de datos entre tiendas y previniendo conflictos de IDs.

## Architecture

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  (Inventory, POS, Products, Sales, Purchases)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     API Layer                            │
│  /api/products, /api/sales, /api/seed, /api/cleanup    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│  MovementService, ID Generator                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  MongoDB Models (Product, Sale, Purchase, etc.)         │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ID Generator Utility

**Ubicación:** `src/lib/id-generator.ts`

```typescript
export class IDGenerator {
  /**
   * Genera un ID único global
   * Formato: {prefix}_{storeId}_{timestamp}_{random}
   */
  static generate(prefix: string, storeId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${storeId}_${timestamp}_${random}`;
  }

  /**
   * Genera múltiples IDs únicos
   */
  static generateBatch(prefix: string, storeId: string, count: number): string[] {
    return Array.from({ length: count }, () => this.generate(prefix, storeId));
  }

  /**
   * Valida formato de ID
   */
  static validate(id: string): boolean {
    const pattern = /^[a-z]+_[a-z0-9_]+_\d+_[a-z0-9]+$/;
    return pattern.test(id);
  }

  /**
   * Extrae storeId de un ID
   */
  static extractStoreId(id: string): string | null {
    const parts = id.split('_');
    return parts.length >= 4 ? parts[1] : null;
  }
}
```

### 2. Seed Service Mejorado

**Ubicación:** `src/app/api/seed/route.ts`

**Flujo de Seed:**

```
1. Validar storeId
2. Limpiar datos existentes (deleteMany por storeId)
3. Generar IDs únicos para productos
4. Crear mapa de IDs antiguos → nuevos
5. Actualizar referencias en ventas/compras
6. Insertar datos con manejo de errores
7. Registrar logs detallados
8. Retornar estadísticas
```

**Estructura de Respuesta:**

```typescript
{
  success: boolean;
  stats: {
    deleted: {
      products: number;
      sales: number;
      purchases: number;
      // ... otros
    };
    inserted: {
      products: number;
      sales: number;
      purchases: number;
      // ... otros
    };
    idMappings: {
      products: Map<string, string>; // old → new
    };
  };
  errors?: string[];
}
```

### 3. Cleanup Service

**Ubicación:** `src/app/api/products/cleanup/route.ts`

**Algoritmo de Limpieza:**

```
1. Obtener todos los productos del storeId
2. Agrupar por ID
3. Para cada grupo con duplicados:
   a. Ordenar por updatedAt (más reciente primero)
   b. Mantener el primero
   c. Marcar los demás para eliminación
4. Ejecutar deleteMany con IDs marcados
5. Retornar estadísticas
```

### 4. Modelos con Índices Únicos

**Todos los modelos deben tener:**

```typescript
// Índice único compuesto
Schema.index({ id: 1, storeId: 1 }, { unique: true, background: true });

// Para productos, también:
Schema.index({ sku: 1, storeId: 1 }, { unique: true, background: true });
```

## Data Models

### Product Model (Actualizado)

```typescript
{
  id: string;              // Generado: prod_{storeId}_{timestamp}_{random}
  storeId: string;         // Requerido, indexado
  sku: string;             // Código de negocio, único por tienda
  name: string;
  stock: number;
  price: number;
  // ... otros campos
  _id: ObjectId;           // MongoDB automático
  createdAt: Date;
  updatedAt: Date;
}
```

### Sale Model (Actualizado)

```typescript
{
  id: string;              // Generado: sale_{storeId}_{timestamp}_{random}
  storeId: string;
  customerId: string;
  items: [{
    productId: string;     // Referencia a Product.id del mismo storeId
    productName: string;
    quantity: number;
    price: number;
  }];
  total: number;
  // ... otros campos
}
```

### InventoryMovement Model

```typescript
{
  productId: string;       // Referencia a Product.id
  storeId: string;         // Requerido
  warehouseId: string;
  movementType: enum;
  quantity: number;
  // ... otros campos
}
```

## Error Handling

### Tipos de Errores

1. **Duplicate Key Error (11000)**
   - Detectar en seed
   - Limpiar y reintentar
   - Registrar en logs

2. **Validation Error**
   - Validar storeId requerido
   - Validar formato de IDs
   - Retornar 400 Bad Request

3. **Not Found Error**
   - Producto no existe
   - Retornar 404 Not Found

4. **Reference Error**
   - productId no existe en storeId
   - Validar antes de insertar
   - Retornar 400 Bad Request

### Estrategia de Manejo

```typescript
try {
  // Operación principal
  await insertData();
} catch (error) {
  if (error.code === 11000) {
    // Duplicado: limpiar y reintentar
    await cleanup();
    await insertData();
  } else if (error.name === 'ValidationError') {
    // Error de validación
    return { error: error.message, status: 400 };
  } else {
    // Error desconocido
    console.error('Error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}
```

## Testing Strategy

### Unit Tests

1. **IDGenerator**
   - Generar IDs únicos
   - Validar formato
   - Extraer storeId

2. **Seed Service**
   - Generar IDs únicos por tienda
   - Actualizar referencias correctamente
   - Manejar errores de duplicados

3. **Cleanup Service**
   - Identificar duplicados
   - Mantener versión correcta
   - Retornar estadísticas precisas

### Integration Tests

1. **Multitienda**
   - Crear dos tiendas
   - Verificar IDs únicos
   - Verificar aislamiento de datos

2. **Referencias**
   - Crear venta con productos
   - Verificar productId válido
   - Verificar mismo storeId

3. **Seed Completo**
   - Ejecutar seed
   - Verificar conteos
   - Verificar integridad referencial

### Manual Tests

1. Crear tienda 1, ejecutar seed
2. Crear tienda 2, ejecutar seed
3. Verificar que no hay conflictos de IDs
4. Verificar que cada tienda ve solo sus datos
5. Ejecutar cleanup y verificar resultados

## Performance Considerations

### Índices

- Índice compuesto (id, storeId) para búsquedas rápidas
- Índice en storeId para filtrado
- Índice en (sku, storeId) para productos

### Optimizaciones

- Usar `insertMany` en lugar de múltiples `insert`
- Usar `deleteMany` en lugar de múltiples `delete`
- Generar IDs en lote cuando sea posible
- Usar `lean()` para consultas de solo lectura

### Límites

- Máximo 1000 productos por seed
- Máximo 100 movimientos por consulta
- Timeout de 30 segundos para seed

## Security Considerations

### Validaciones

1. **storeId Validation**
   - Verificar que el usuario tiene acceso al storeId
   - Validar formato de storeId
   - Prevenir inyección

2. **ID Validation**
   - Validar formato antes de usar
   - Prevenir IDs maliciosos
   - Sanitizar entrada

3. **Authorization**
   - Solo admins pueden ejecutar seed
   - Solo admins pueden ejecutar cleanup
   - Verificar permisos antes de operaciones

### Auditoría

- Registrar quién ejecutó seed
- Registrar quién ejecutó cleanup
- Registrar cambios en productos
- Mantener historial de movimientos

## Migration Plan

### Fase 1: Preparación
1. Crear IDGenerator utility
2. Actualizar modelos con índices
3. Crear API de cleanup

### Fase 2: Seed
1. Actualizar seed para generar IDs únicos
2. Actualizar referencias en items
3. Agregar logs detallados

### Fase 3: Validación
1. Ejecutar tests
2. Verificar en ambiente de desarrollo
3. Limpiar duplicados existentes

### Fase 4: Producción
1. Backup de base de datos
2. Ejecutar cleanup en producción
3. Monitorear logs
4. Verificar integridad de datos
