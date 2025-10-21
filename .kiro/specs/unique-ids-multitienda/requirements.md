# Requirements Document

## Introduction

Este documento define los requerimientos para mejorar el sistema de identificadores únicos en la aplicación multitienda, garantizando que no haya conflictos entre diferentes tiendas y que todos los datos estén correctamente aislados por `storeId`.

## Glossary

- **ID**: Identificador único generado por el sistema para cada registro en la base de datos
- **SKU**: Stock Keeping Unit - Código de producto definido por el usuario/negocio
- **storeId**: Identificador único de cada tienda en el sistema multitienda
- **_id**: ObjectId generado automáticamente por MongoDB
- **Seed**: Proceso de inicialización de datos de demostración en la base de datos
- **Índice Único**: Restricción de base de datos que previene duplicados

## Requirements

### Requirement 1: Sistema de IDs Únicos Globales

**User Story:** Como desarrollador del sistema, quiero que todos los IDs sean únicos globalmente, para que no haya conflictos entre diferentes tiendas.

#### Acceptance Criteria

1. WHEN se crea un nuevo registro (producto, venta, compra, etc.), THE System SHALL generar un ID único que incluya timestamp y componente aleatorio
2. THE System SHALL garantizar que el ID generado sea único globalmente en toda la base de datos
3. THE System SHALL incluir el storeId como parte del ID para trazabilidad
4. THE System SHALL usar el formato `{tipo}_{storeId}_{timestamp}_{random}` para todos los IDs
5. WHERE se ejecuta el seed de datos, THE System SHALL generar IDs únicos para cada tienda

### Requirement 2: Aislamiento de Datos por Tienda

**User Story:** Como administrador de tienda, quiero que mis datos estén completamente aislados de otras tiendas, para que no haya interferencia entre negocios.

#### Acceptance Criteria

1. THE System SHALL incluir el campo storeId en todos los modelos de datos de negocio
2. WHEN se consulta cualquier dato, THE System SHALL filtrar por storeId
3. WHEN se elimina una tienda, THE System SHALL eliminar todos los datos asociados a ese storeId
4. THE System SHALL prevenir acceso a datos de otras tiendas mediante validación de storeId
5. WHERE se crean índices únicos, THE System SHALL incluir storeId en el índice compuesto

### Requirement 3: Integridad Referencial entre Entidades

**User Story:** Como usuario del sistema, quiero que las relaciones entre entidades (ventas-productos, compras-productos) se mantengan correctas, para que los reportes sean precisos.

#### Acceptance Criteria

1. WHEN se crea una venta, THE System SHALL usar IDs válidos de productos existentes en la misma tienda
2. WHEN se actualiza un producto, THE System SHALL mantener las referencias en ventas y compras
3. THE System SHALL validar que productId en items corresponda a productos del mismo storeId
4. WHERE se eliminan productos, THE System SHALL verificar que no tengan ventas asociadas
5. THE System SHALL actualizar referencias de productId cuando se regeneran IDs en el seed

### Requirement 4: Seed de Datos Multitienda

**User Story:** Como administrador del sistema, quiero poder inicializar múltiples tiendas con datos de demostración, para que cada tienda tenga su propio conjunto de datos independiente.

#### Acceptance Criteria

1. WHEN se ejecuta el seed para una tienda, THE System SHALL generar IDs únicos para esa tienda
2. THE System SHALL limpiar completamente los datos existentes de la tienda antes de insertar nuevos
3. THE System SHALL actualizar todas las referencias de productId en ventas y compras con los nuevos IDs
4. THE System SHALL registrar en logs cuántos registros se eliminaron e insertaron
5. WHERE hay errores de duplicados, THE System SHALL limpiar e intentar nuevamente

### Requirement 5: Validación de Unicidad

**User Story:** Como desarrollador, quiero que el sistema prevenga duplicados automáticamente, para mantener la integridad de los datos.

#### Acceptance Criteria

1. THE System SHALL crear índices únicos compuestos (id + storeId) en todos los modelos
2. WHEN se intenta insertar un registro duplicado, THE System SHALL rechazar la operación
3. THE System SHALL crear índice único compuesto (sku + storeId) para productos
4. THE System SHALL permitir que diferentes tiendas usen el mismo SKU
5. WHERE se detectan duplicados existentes, THE System SHALL proveer API para limpiarlos

### Requirement 6: Logs y Trazabilidad

**User Story:** Como administrador, quiero ver logs detallados de las operaciones de seed, para poder diagnosticar problemas.

#### Acceptance Criteria

1. THE System SHALL registrar en logs cada operación de eliminación con conteo de registros
2. THE System SHALL registrar en logs cada operación de inserción con conteo de registros
3. WHEN hay errores, THE System SHALL registrar el tipo de error y contexto
4. THE System SHALL mostrar el mapeo de IDs antiguos a nuevos en el seed
5. THE System SHALL incluir timestamps en todos los logs

### Requirement 7: APIs de Limpieza

**User Story:** Como administrador, quiero poder limpiar duplicados existentes, para corregir problemas de datos.

#### Acceptance Criteria

1. THE System SHALL proveer endpoint `/api/products/cleanup` para eliminar duplicados
2. WHEN se ejecuta la limpieza, THE System SHALL mantener solo la versión más reciente de cada producto
3. THE System SHALL retornar estadísticas de la limpieza (registros eliminados, productos únicos)
4. THE System SHALL validar storeId antes de ejecutar la limpieza
5. WHERE hay múltiples duplicados, THE System SHALL ordenar por fecha de actualización

### Requirement 8: Compatibilidad con Código Existente

**User Story:** Como desarrollador, quiero que los cambios no rompan funcionalidad existente, para mantener la estabilidad del sistema.

#### Acceptance Criteria

1. THE System SHALL mantener el campo `id` en todos los modelos (no usar solo _id)
2. THE System SHALL mantener compatibilidad con APIs existentes que usan `id`
3. THE System SHALL mantener compatibilidad con frontend que espera `product.id`
4. WHERE se generan nuevos IDs, THE System SHALL usar formato string legible
5. THE System SHALL mantener el campo `_id` de MongoDB sin modificaciones
