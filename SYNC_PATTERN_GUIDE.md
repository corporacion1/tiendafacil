# Guía de Sincronización Automática

## Problema Solucionado
Después de guardar datos en cualquier módulo del sistema, los cambios ahora se reflejan automáticamente en el frontend sin necesidad de refrescar la página.

## Implementación

### 1. Hook de Sincronización Automática
Se creó el hook `useAutoSync` en `src/hooks/use-auto-sync.ts` que proporciona:

- `createWithSync()` - Para operaciones POST (crear)
- `updateWithSync()` - Para operaciones PUT (actualizar)  
- `deleteWithSync()` - Para operaciones DELETE (eliminar)

### 2. Funciones del Hook

#### createWithSync
```typescript
const result = await createWithSync<Product>('/api/products', newProduct, {
  successMessage: "Producto creado exitosamente",
  errorMessage: "Error al crear producto",
  syncType: 'products', // 'full' | 'products' | 'none'
  updateState: (savedProduct) => {
    setProducts(prev => [savedProduct, ...prev]);
  }
});
```

#### updateWithSync
```typescript
const result = await updateWithSync<Product>('/api/products', productData, {
  successMessage: "Producto actualizado exitosamente",
  errorMessage: "Error al actualizar producto", 
  syncType: 'products',
  updateState: (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }
});
```

#### deleteWithSync
```typescript
const success = await deleteWithSync('/api/products', productId, {
  successMessage: "Producto eliminado exitosamente",
  errorMessage: "Error al eliminar producto",
  syncType: 'products', 
  updateState: (deletedId) => {
    setProducts(prev => prev.filter(p => p.id !== deletedId));
  }
});
```

### 3. Tipos de Sincronización

- **`'full'`**: Recarga todos los datos del contexto (settings, products, sales, etc.)
- **`'products'`**: Solo recarga los productos
- **`'none'`**: No hace sincronización automática adicional

### 4. Módulos Ya Actualizados

✅ **Settings** - Configuración de la tienda
✅ **Products** - Creación de productos  
✅ **Inventory** - Actualización y eliminación de productos
✅ **POS** - Ya tenía sincronización correcta

### 5. Módulos Pendientes de Actualizar

❌ **Purchases** - Gestión de compras
❌ **Credits** - Gestión de créditos
❌ **Cash-sessions** - Sesiones de caja
❌ **Customers** - Gestión de clientes
❌ **Suppliers** - Gestión de proveedores

## Cómo Aplicar el Patrón

### Paso 1: Importar el Hook
```typescript
import { useAutoSync } from "@/hooks/use-auto-sync";
```

### Paso 2: Usar el Hook en el Componente
```typescript
export default function MyPage() {
  const { createWithSync, updateWithSync, deleteWithSync } = useAutoSync();
  // ... resto del componente
}
```

### Paso 3: Reemplazar Fetch Manual
**Antes:**
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

if (!response.ok) {
  throw new Error('Error');
}

const result = await response.json();
setItems(prev => [result, ...prev]);

toast({
  title: "Éxito",
  description: "Operación completada"
});
```

**Después:**
```typescript
const result = await createWithSync('/api/endpoint', data, {
  successMessage: "Operación completada exitosamente",
  errorMessage: "Error en la operación",
  syncType: 'full',
  updateState: (newItem) => {
    setItems(prev => [newItem, ...prev]);
  }
});
```

## Beneficios

1. **Sincronización Automática**: Los datos se actualizan inmediatamente
2. **Manejo de Errores Consistente**: Mensajes de error estandarizados
3. **Feedback Visual**: Toast notifications automáticas
4. **Logging Detallado**: Para debugging y monitoreo
5. **Código Más Limpio**: Menos código repetitivo
6. **Experiencia de Usuario Mejorada**: No más necesidad de refrescar páginas

## Ejemplo Completo

```typescript
// En el componente
const { createWithSync } = useAutoSync();
const { setCustomers } = useSettings();

const handleCreateCustomer = async (customerData) => {
  const result = await createWithSync('/api/customers', customerData, {
    successMessage: `Cliente "${customerData.name}" creado exitosamente`,
    errorMessage: "No se pudo crear el cliente",
    syncType: 'full',
    updateState: (newCustomer) => {
      setCustomers(prev => [newCustomer, ...prev]);
    }
  });
  
  if (result) {
    // Cerrar modal, limpiar formulario, etc.
    setIsModalOpen(false);
    resetForm();
  }
};
```

Este patrón debe aplicarse a todos los módulos del sistema para garantizar una experiencia de usuario fluida y consistente.