# Implementation Plan

## 1. Crear utilidad de generación de IDs
- Crear archivo `src/lib/id-generator.ts`
- Implementar función `generate(prefix, storeId)` que retorna ID único
- Implementar función `generateBatch(prefix, storeId, count)` para múltiples IDs
- Implementar función `validate(id)` para validar formato
- Implementar función `extractStoreId(id)` para extraer storeId de un ID
- _Requirements: 1.1, 1.2, 1.3, 1.4_

## 2. Actualizar seed para generar IDs únicos
- Importar IDGenerator en `src/app/api/seed/route.ts`
- Modificar inserción de productos para usar `IDGenerator.generate('prod', storeId)`
- Crear mapa de IDs antiguos a nuevos (Map<string, string>)
- Actualizar referencias de productId en items de ventas usando el mapa
- Actualizar referencias de productId en items de compras usando el mapa
- Actualizar referencias de productId en items de órdenes pendientes usando el mapa
- Generar IDs únicos para ventas usando `IDGenerator.generate('sale', storeId)`
- Generar IDs únicos para compras usando `IDGenerator.generate('purchase', storeId)`
- Agregar logs detallados mostrando mapeo de IDs
- _Requirements: 4.1, 4.2, 4.3, 4.4, 6.4_

## 3. Mejorar logs del seed
- Agregar log de inicio con storeId
- Registrar conteo de registros eliminados por colección
- Registrar conteo de registros insertados por colección
- Registrar tiempo de ejecución
- Agregar logs de errores con contexto completo
- _Requirements: 6.1, 6.2, 6.3, 6.5_

## 4. Actualizar índices en modelos
- Verificar que Product tiene índice (id, storeId) único
- Verificar que Product tiene índice (sku, storeId) único
- Agregar índice (id, storeId) a Sale si no existe
- Agregar índice (id, storeId) a Purchase si no existe
- Agregar índice (id, storeId) a todos los modelos de negocio
- _Requirements: 5.1, 5.3, 5.4_

## 5. Validar storeId en todas las APIs
- Revisar `/api/products` para validar storeId en todas las operaciones
- Revisar `/api/sales` para validar storeId
- Revisar `/api/purchases` para validar storeId
- Agregar validación de storeId en MovementService
- Retornar error 400 si falta storeId
- _Requirements: 2.2, 2.4_

## 6. Mejorar API de cleanup
- Verificar que `/api/products/cleanup` existe y funciona
- Agregar validación de storeId requerido
- Mejorar algoritmo para ordenar por updatedAt
- Agregar estadísticas detalladas en respuesta
- Agregar logs de operación
- _Requirements: 7.1, 7.2, 7.3, 7.4_

## 7. Actualizar MovementService para validar referencias
- Modificar `recordMovement` para validar que productId existe en storeId
- Modificar `recordSaleMovements` para validar productIds
- Modificar `recordPurchaseMovements` para validar productIds
- Agregar logs cuando productId no se encuentra
- Retornar error descriptivo si productId inválido
- _Requirements: 3.1, 3.3_

## 8. Crear tests para IDGenerator
- Crear archivo `src/lib/__tests__/id-generator.test.ts`
- Test: generar ID con formato correcto
- Test: IDs generados son únicos
- Test: validar formato de ID correcto
- Test: validar formato de ID incorrecto
- Test: extraer storeId correctamente
- _Requirements: 1.1, 1.2, 1.3, 1.4_

## 9. Crear tests de integración para seed
- Crear archivo `src/app/api/seed/__tests__/seed.test.ts`
- Test: seed genera IDs únicos para productos
- Test: seed actualiza referencias en ventas
- Test: seed actualiza referencias en compras
- Test: seed maneja errores de duplicados
- Test: seed retorna estadísticas correctas
- _Requirements: 4.1, 4.3, 4.4, 4.5_

## 10. Documentar cambios
- Actualizar README con información sobre IDs únicos
- Documentar formato de IDs en comentarios de código
- Agregar ejemplos de uso de IDGenerator
- Documentar proceso de seed mejorado
- Documentar API de cleanup
- _Requirements: 8.1, 8.2, 8.3, 8.4_

## 11. Validación final y limpieza
- Ejecutar seed en ambiente de desarrollo
- Verificar que no hay duplicados
- Verificar que referencias son correctas
- Ejecutar cleanup si hay duplicados existentes
- Verificar logs para errores
- Hacer backup de base de datos antes de producción
- _Requirements: 2.1, 2.3, 5.2, 7.5_
