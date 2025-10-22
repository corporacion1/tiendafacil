# 🔄 Flujo Completo de Estados de Órdenes

## ✅ **CONFIRMACIÓN**: Las órdenes procesadas NO aparecen en listas de pendientes

### 📊 **Estados Disponibles**
```typescript
enum OrderStatus {
  PENDING = 'pending',      // 🟡 Recién creada, esperando procesamiento
  PROCESSING = 'processing', // 🔵 Cargada en POS, siendo procesada
  PROCESSED = 'processed',   // ✅ Completada y facturada
  CANCELLED = 'cancelled',   // ❌ Cancelada
  EXPIRED = 'expired'        // ⏰ Expirada
}
```

## 🔄 **Flujo Completo de Estados**

### 1. **Creación de Orden (Catálogo)**
```
Cliente genera pedido → BD: status = 'pending'
```

### 2. **Carga en POS**
```
Cajero carga pedido → updateOrderStatus(orderId, 'processing')
```

### 3. **Procesamiento Automático**
```
Cajero procesa venta → Automáticamente: status = 'processed'
```

## 🎯 **Filtrado por Dispositivo**

### 📱 **POS (Cajero)**
- **Hook**: `usePendingOrders(storeId)`
- **API Call**: `/api/orders?storeId=X&status=pending`
- **Resultado**: Solo órdenes con `status = 'pending'`
- **Comportamiento**: ✅ Las órdenes procesadas **NO** aparecen

### 🛒 **Catálogo (Cliente)**
- **Hook**: `useUserOrders(email, storeId)`
- **API Call**: `/api/orders?customerEmail=X&storeId=Y`
- **Resultado**: **TODAS** las órdenes del usuario (historial completo)
- **Comportamiento**: ✅ Muestra todas con badges de estado

## 🔍 **Verificación del Flujo**

### ✅ **Cuando se procesa una orden**:

1. **POS ejecuta venta** → `processSale()`
2. **Sistema busca órdenes relacionadas**:
   ```javascript
   const processingOrders = pendingOrdersFromDB.filter(order => 
     order.customerPhone === selectedCustomer?.phone ||
     order.customerName === selectedCustomer?.name
   );
   ```
3. **Compara productos** (coincidencia ≥70%)
4. **Actualiza estado automáticamente**:
   ```javascript
   fetch('/api/orders', {
     method: 'PUT',
     body: JSON.stringify({
       orderId: order.orderId,
       status: 'processed',        // ← CAMBIO DE ESTADO
       processedBy: 'Usuario POS',
       saleId: saleId,
       notes: `Pedido completado con venta ${saleId}`
     })
   });
   ```

### ✅ **Resultado inmediato**:
- **POS**: La orden desaparece de "Pedidos Pendientes" (próximo polling en ≤10s)
- **Catálogo**: La orden cambia a badge "Procesado" (próximo polling en ≤10s)

## 🎛️ **Visualización por Estado**

### **POS - Solo Pendientes**
```
🟡 ORD-001 - Juan Pérez - $25.50 [Cargar]
🟡 ORD-002 - María López - $18.75 [Cargar]
```

### **Catálogo - Historial Completo**
```
✅ ORD-003 - Procesado - $32.00
🔵 ORD-002 - Procesando - $18.75  
🟡 ORD-001 - Pendiente - $25.50
```

## 🔄 **Sincronización en Tiempo Real**

### **Escenario Completo**:
1. **T=0s**: Cliente crea orden → `status: 'pending'`
2. **T=5s**: POS detecta nueva orden (polling)
3. **T=30s**: Cajero carga orden → `status: 'processing'`
4. **T=35s**: Cliente ve cambio a "Procesando" (polling)
5. **T=60s**: Cajero procesa venta → `status: 'processed'`
6. **T=65s**: 
   - **POS**: Orden desaparece de pendientes
   - **Cliente**: Ve orden como "Procesado"

## ✅ **Confirmación Final**

**SÍ, las órdenes procesadas:**
- ✅ **Cambian estado** a `'processed'`
- ✅ **NO aparecen** en POS (solo pendientes)
- ✅ **SÍ aparecen** en catálogo (historial completo con badge "Procesado")
- ✅ **Se sincronizan** automáticamente en tiempo real

**El flujo está funcionando correctamente para evitar duplicados y mantener un historial completo.**