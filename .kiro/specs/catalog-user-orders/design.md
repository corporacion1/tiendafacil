# Design Document

## Overview

Este diseño implementa un sistema completamente asíncrono para la gestión de pedidos donde los clientes generan pedidos en sus dispositivos y los cajeros los procesan desde dispositivos remotos. La base de datos MongoDB actúa como la única fuente de verdad, eliminando completamente el sistema de pedidos locales y implementando sincronización en tiempo real entre dispositivos.

## Architecture

### Current State Analysis

La implementación actual utiliza:
- `localOrders` state para almacenar pedidos del contexto local (SERÁ ELIMINADO)
- `pendingOrdersContext` del settings context para pedidos globales (SERÁ ELIMINADO)
- Filtrado por `customerPhone` para usuarios autenticados
- API `/api/orders` que soporta filtrado por `customerEmail`

### Proposed Changes

1. **Database-Only Architecture**: Eliminar completamente el sistema de pedidos locales
2. **Asynchronous Order Management**: Implementar sincronización en tiempo real entre dispositivos
3. **Real-time Updates**: Sistema de polling o WebSockets para actualizaciones automáticas
4. **Offline Resilience**: Manejo de desconexiones con queue de operaciones pendientes
5. **Authentication-Required Orders**: Todos los pedidos requieren usuario autenticado

## Components and Interfaces

### 1. Custom Hook: useUserOrders

```typescript
interface UseUserOrdersReturn {
  orders: PendingOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

const useUserOrders = (userEmail?: string, storeId?: string): UseUserOrdersReturn
```

**Responsibilities:**
- Fetch orders from database when user is authenticated
- Implement automatic polling every 10 seconds for real-time updates
- Handle network status changes and automatic reconnection
- Optimize polling with page visibility detection
- Handle caching and error states with retry logic
- Provide manual refetch functionality

### 2. Custom Hook: useNetworkStatus

```typescript
interface UseNetworkStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
}

const useNetworkStatus = (): UseNetworkStatusReturn
```

**Responsibilities:**
- Monitor network connection status
- Detect when connection is restored after being offline
- Trigger data refresh when network comes back online

### 3. Custom Hook: useProducts

```typescript
interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  lastUpdated: Date | null;
}

const useProducts = (storeId?: string): UseProductsReturn
```

**Responsibilities:**
- Fetch products from database with automatic synchronization
- Implement polling every 30 seconds for product updates
- Handle network-aware fetching with offline support
- Optimize performance with page visibility detection

### 4. Custom Hook: usePendingOrders (POS Integration)

```typescript
interface UsePendingOrdersReturn {
  orders: PendingOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  updateOrderStatus: (orderId: string, status: string, saleId?: string) => Promise<void>;
}

const usePendingOrders = (storeId?: string): UsePendingOrdersReturn
```

**Responsibilities:**
- Fetch only pending orders for POS processing
- Implement automatic polling for new orders
- Provide order status update functionality for cashiers
- Handle order processing workflow integration

### 2. Enhanced Order Management

**Order Source Identification:**
```typescript
interface EnhancedOrder extends PendingOrder {
  source: 'local' | 'database';
  canEdit: boolean;
  canDelete: boolean;
}
```

**Order Merging Logic:**
- Database orders take precedence over local orders with same orderId
- Local orders without corresponding database entry remain as-is
- Orders sorted by createdAt descending

### 3. API Integration

**Existing API Enhancement:**
- `/api/orders?customerEmail={email}&storeId={storeId}` - Fetch user orders
- Support for status filtering to show relevant orders
- Proper error handling and response formatting

## Data Models

### Order Fetching Flow

```typescript
// 1. Check authentication status
if (authUser?.email) {
  // 2. Fetch from database
  const dbOrders = await fetchOrdersByEmail(authUser.email, storeId);
  
  // 3. Merge with local orders
  const mergedOrders = mergeOrders(dbOrders, localOrders);
  
  // 4. Update state
  setDisplayOrders(mergedOrders);
} else {
  // 5. Use only local orders for non-authenticated users
  setDisplayOrders(localOrders);
}
```

### Order Merging Algorithm

```typescript
function mergeOrders(dbOrders: PendingOrder[], localOrders: PendingOrder[]): EnhancedOrder[] {
  const orderMap = new Map<string, EnhancedOrder>();
  
  // Add database orders first (higher priority)
  dbOrders.forEach(order => {
    orderMap.set(order.orderId, {
      ...order,
      source: 'database',
      canEdit: true,
      canDelete: false // Soft delete only
    });
  });
  
  // Add local orders that don't exist in database
  localOrders.forEach(order => {
    if (!orderMap.has(order.orderId)) {
      orderMap.set(order.orderId, {
        ...order,
        source: 'local',
        canEdit: true,
        canDelete: true
      });
    }
  });
  
  return Array.from(orderMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
```

## Error Handling

### API Error Scenarios

1. **Network Failure**: Show error toast, fallback to local orders
2. **Authentication Error**: Clear user session, show local orders only
3. **Server Error**: Log error, show warning message, use cached data if available
4. **Timeout**: Show timeout message, provide retry option

### Error Recovery Strategy

```typescript
const fetchUserOrders = async (email: string, storeId: string) => {
  try {
    const response = await fetch(`/api/orders?customerEmail=${email}&storeId=${storeId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    toast({
      variant: "destructive",
      title: "Error al cargar pedidos",
      description: "Mostrando solo pedidos locales. Intenta recargar la página."
    });
    return []; // Fallback to empty array
  }
};
```

## Testing Strategy

### Unit Tests
- Order merging logic with various scenarios
- useUserOrders hook with different authentication states
- Error handling for API failures

### Integration Tests
- Full order loading flow for authenticated users
- Fallback behavior for non-authenticated users
- Order actions (edit, delete, QR generation) for both order types

### Test Scenarios

1. **Authenticated User with Database Orders**
   - Should fetch and display database orders
   - Should merge with local orders correctly
   - Should handle duplicate orders properly

2. **Authenticated User with API Failure**
   - Should show error message
   - Should fallback to local orders
   - Should provide retry mechanism

3. **Non-Authenticated User**
   - Should display only local orders
   - Should not attempt database fetch
   - Should maintain existing functionality

4. **Order Actions**
   - QR regeneration for both order types
   - Edit functionality loading items to cart
   - Delete behavior (soft delete for DB orders, hard delete for local)

## Real-Time Synchronization Architecture

### Multi-Device Synchronization
- **Order Synchronization**: 10-second polling intervals for order status updates
- **Product Synchronization**: 30-second polling intervals for inventory updates
- **Network-Aware Polling**: Automatic pause/resume based on connection status
- **Page Visibility Optimization**: Stop polling when page is hidden, resume when visible

### Polling Strategy
```typescript
// Order polling configuration
const ORDER_POLLING_INTERVAL = 10000; // 10 seconds
const PRODUCT_POLLING_INTERVAL = 30000; // 30 seconds
const MIN_FETCH_INTERVAL = 2000; // Minimum time between requests

// Automatic retry logic
const MAX_RETRIES = 3;
const RETRY_BACKOFF = 1000; // 1 second
```

### Visual Status Indicators
- **Connected**: Green indicator when online and syncing
- **Syncing Orders**: Blue indicator during order updates
- **Syncing Products**: Orange indicator during product updates  
- **Offline**: Red indicator when disconnected

### POS Integration Flow
1. **Order Creation**: Client creates order → Database (status: pending)
2. **POS Detection**: POS polls for pending orders every 10 seconds
3. **Order Processing**: Cashier processes order → Status update (processing → processed)
4. **Client Update**: Client receives status update via polling

## Performance Considerations

### Caching Strategy
- Cache orders and products in component state during session
- Invalidate cache on authentication changes
- Implement stale-while-revalidate pattern for better UX
- Use JSON comparison to avoid unnecessary re-renders

### Loading States
- Show skeleton loading for initial data fetch
- Progressive loading: show cached data immediately, then update with fresh data
- Debounce API calls to prevent excessive requests
- Implement minimum fetch intervals to avoid spam

### Memory Management
- Limit number of cached orders (last 50 orders)
- Clear cache on component unmount
- Implement proper cleanup in useEffect hooks
- Use refs to track component mount status

### Network Optimization
- Pause polling when page is hidden
- Resume polling when page becomes visible
- Implement exponential backoff for failed requests
- Queue operations during offline periods

## Security Considerations

### Data Access Control
- Ensure orders are filtered by user email on server side
- Validate user authentication before API calls
- Implement proper error messages that don't leak sensitive information

### Client-Side Security
- Don't store sensitive order data in localStorage
- Clear order cache on logout
- Validate order data structure before processing

## Migration Strategy

### Backward Compatibility
- Maintain existing functionality for non-authenticated users
- Preserve all current order management features
- Ensure no breaking changes to existing UI components

### Rollout Plan
1. Implement useUserOrders hook with feature flag
2. Test with small subset of authenticated users
3. Gradually enable for all authenticated users
4. Monitor error rates and performance metrics