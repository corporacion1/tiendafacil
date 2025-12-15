# Design Document

## Overview

El sistema de auto-apertura de detalles del producto en el catálogo necesita ser corregido para funcionar de manera confiable cuando hay una coincidencia exacta por SKU. El diseño se enfoca en mejorar la lógica existente, añadir mejor manejo de estados y asegurar que la funcionalidad sea robusta y predecible.

## Architecture

El sistema utiliza React hooks y efectos para manejar la lógica de auto-apertura:

- **Estado de búsqueda**: Maneja el término de búsqueda actual
- **Estado de productos filtrados**: Calcula productos que coinciden con los criterios
- **Estado de auto-apertura**: Rastrea qué productos ya han sido auto-abiertos
- **Efectos de sincronización**: Coordinan la apertura automática basada en cambios de estado

## Components and Interfaces

### Existing Components to Modify

1. **CatalogPage Component**
   - `searchTerm`: Estado del término de búsqueda
   - `lastAutoOpenedSku`: Rastrea el último SKU auto-abierto
   - `productDetails`: Estado del producto actualmente mostrado en modal
   - `sortedAndFilteredProducts`: Productos filtrados por criterios de búsqueda

### Key Functions

1. **Auto-open Effect**
   - Monitorea cambios en productos filtrados
   - Evalúa condiciones para auto-apertura
   - Ejecuta apertura de modal cuando es apropiado

2. **Search Reset Logic**
   - Limpia el estado de auto-apertura cuando cambia el término de búsqueda
   - Previene aperturas duplicadas

## Data Models

### Auto-open State
```typescript
interface AutoOpenState {
  lastAutoOpenedSku: string | null;
  searchTerm: string;
  productDetails: Product | null;
}
```

### Search Criteria
```typescript
interface SearchCriteria {
  term: string;
  isExactMatch: boolean;
  resultCount: number;
  matchingProduct?: Product;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Reviewing the identified properties, I can consolidate some redundant ones:
- Properties 1.2 and 2.3 both test the "exactly one match" condition - these can be combined
- Properties 2.1 and 2.2 both test case-insensitive matching - these can be combined
- Property 1.5 and 3.4 both relate to state management - these can be combined

**Property 1: Auto-open on exact SKU match**
*For any* product with a valid SKU, when searching for that exact SKU (case-insensitive) and exactly one product matches, the product detail modal should open automatically
**Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**

**Property 2: Search input clearing after auto-open**
*For any* automatically opened product detail modal, the search input should be cleared to allow free navigation
**Validates: Requirements 1.3**

**Property 3: State preservation after modal closure**
*For any* automatically opened product detail modal, when closed by the user, the search state should be maintained appropriately
**Validates: Requirements 1.4**

**Property 4: Duplicate auto-opening prevention**
*For any* SKU search term, repeated searches should only trigger auto-opening once until the search term changes
**Validates: Requirements 1.5, 3.4**

**Property 5: No auto-open without exact match**
*For any* search term that doesn't exactly match a single product SKU, no automatic modal opening should occur
**Validates: Requirements 2.4**

**Property 6: Error handling resilience**
*For any* error that occurs during the auto-opening process, the search functionality should continue to work normally
**Validates: Requirements 3.2**

## Error Handling

### Auto-open Failures
- If modal opening fails, log error and continue with normal search display
- If state updates fail, reset to safe default state
- If product data is invalid, skip auto-opening and show normal results

### Search State Corruption
- Validate search state before processing
- Reset corrupted state to defaults
- Provide fallback behavior for edge cases

### Performance Considerations
- Debounce search input to prevent excessive filtering
- Memoize expensive calculations
- Limit auto-opening to prevent UI thrashing

## Testing Strategy

### Unit Testing Approach
- Test individual functions for SKU matching logic
- Test state management functions in isolation
- Test error handling with simulated failures
- Test edge cases like empty search terms, invalid SKUs

### Property-Based Testing Approach
- Use **fast-check** library for property-based testing in TypeScript/React
- Configure each property test to run minimum 100 iterations
- Generate random SKUs, product data, and search scenarios
- Test universal properties across all valid inputs

**Property-based testing requirements:**
- Each correctness property will be implemented as a single property-based test
- Tests will be tagged with comments referencing the design document properties
- Tag format: **Feature: catalog-exact-match-fix, Property {number}: {property_text}**
- Minimum 100 iterations per property test to ensure thorough coverage

**Dual testing approach:**
- Unit tests verify specific examples and edge cases
- Property tests verify universal behaviors across all inputs
- Together they provide comprehensive coverage of both concrete bugs and general correctness