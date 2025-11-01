# Design Document - Multiple Product Images

## Overview

Esta funcionalidad extiende el sistema actual de productos para soportar múltiples imágenes por artículo, manteniendo compatibilidad con la implementación existente. El diseño se enfoca en una experiencia de usuario fluida tanto para administradores como para clientes, con optimizaciones de rendimiento integradas.

## Architecture

### Data Model Changes

#### Product Type Extension
```typescript
export type Product = {
  // ... existing fields
  imageUrl?: string; // Mantener para compatibilidad (será la imagen principal)
  imageHint?: string; // Mantener para compatibilidad
  
  // Nuevos campos para múltiples imágenes
  images?: ProductImage[]; // Array de imágenes del producto
  primaryImageIndex?: number; // Índice de la imagen principal (default: 0)
};

export type ProductImage = {
  id: string; // ID único de la imagen
  url: string; // URL de la imagen original
  thumbnailUrl?: string; // URL del thumbnail generado
  alt?: string; // Texto alternativo
  order: number; // Orden de la imagen (0 = principal)
  uploadedAt: string; // Fecha de subida
  size?: number; // Tamaño del archivo en bytes
  dimensions?: {
    width: number;
    height: number;
  };
};
```

#### Migration Strategy
- Los productos existentes mantendrán `imageUrl` como imagen principal
- Durante la migración, `imageUrl` se convertirá automáticamente al primer elemento del array `images`
- El sistema funcionará con ambos formatos durante la transición

### Storage Architecture

#### File Organization
```
/products/{storeId}/{productId}/
  ├── original/
  │   ├── image-1.jpg
  │   ├── image-2.jpg
  │   └── image-3.jpg
  ├── thumbnails/
  │   ├── image-1-thumb.jpg
  │   ├── image-2-thumb.jpg
  │   └── image-3-thumb.jpg
  └── compressed/
      ├── image-1-compressed.jpg
      ├── image-2-compressed.jpg
      └── image-3-compressed.jpg
```

#### Image Processing Pipeline
1. **Upload** → Validación de formato y tamaño
2. **Compression** → Reducir tamaño manteniendo calidad
3. **Thumbnail Generation** → Crear versiones pequeñas (150x150px)
4. **Storage** → Guardar en estructura organizada
5. **Database Update** → Actualizar registro del producto

## Components and Interfaces

### 1. Image Upload Component (`MultiImageUpload`)

#### Props Interface
```typescript
interface MultiImageUploadProps {
  productId?: string;
  existingImages?: ProductImage[];
  maxImages?: number; // Default: 4
  maxFileSize?: number; // Default: 5MB
  onImagesChange: (images: ProductImage[]) => void;
  onError: (error: string) => void;
}
```

#### Features
- Drag & drop interface
- Preview de imágenes subidas
- Reordenamiento por arrastrar y soltar
- Indicador de imagen principal
- Validación en tiempo real
- Progress bars para uploads

### 2. Product Image Gallery (`ProductImageGallery`)

#### Props Interface
```typescript
interface ProductImageGalleryProps {
  product: Product;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  className?: string;
}
```

#### Features
- Carrusel principal con navegación
- Thumbnails clickeables
- Soporte para gestos táctiles
- Zoom en modal
- Lazy loading
- Indicadores de posición

### 3. Catalog Product Card Enhancement

#### Modificaciones al `CatalogProductCard`
- Mostrar indicador de múltiples imágenes (ej: "1/4")
- Preview rápido al hover (desktop)
- Optimización de carga de imagen principal

### 4. Product Detail Modal Enhancement

#### Nuevas características
- Galería completa integrada
- Navegación entre imágenes
- Zoom functionality
- Compartir imagen específica

## Data Models

### Database Schema (MongoDB)

#### Products Collection Update
```javascript
{
  // ... existing fields
  
  // Nuevo campo para múltiples imágenes
  images: [
    {
      id: "img_001",
      url: "https://storage.../original/image-1.jpg",
      thumbnailUrl: "https://storage.../thumbnails/image-1-thumb.jpg",
      alt: "Vista frontal del producto",
      order: 0,
      uploadedAt: "2024-01-15T10:30:00Z",
      size: 2048576,
      dimensions: {
        width: 1200,
        height: 800
      }
    }
  ],
  primaryImageIndex: 0,
  
  // Mantener para compatibilidad
  imageUrl: "https://storage.../original/image-1.jpg", // Referencia a la imagen principal
  imageHint: "Vista frontal del producto"
}
```

### API Endpoints

#### New Endpoints
```typescript
// Subir múltiples imágenes
POST /api/products/{productId}/images
Body: FormData with multiple files

// Reordenar imágenes
PUT /api/products/{productId}/images/reorder
Body: { imageIds: string[] }

// Eliminar imagen específica
DELETE /api/products/{productId}/images/{imageId}

// Actualizar imagen principal
PUT /api/products/{productId}/images/primary
Body: { imageId: string }
```

#### Enhanced Endpoints
```typescript
// Obtener producto con imágenes optimizadas
GET /api/products/{productId}?includeImages=true&imageSize=thumbnail|compressed|original
```

## Error Handling

### Upload Errors
- **File too large**: Mostrar mensaje específico con límite
- **Invalid format**: Listar formatos soportados
- **Network error**: Retry automático con backoff
- **Storage full**: Mensaje de contacto con soporte

### Display Errors
- **Image load failure**: Fallback a placeholder
- **Missing thumbnails**: Generar on-demand
- **Slow connection**: Progressive loading

### Data Integrity
- **Orphaned images**: Cleanup job automático
- **Missing references**: Auto-healing en consultas
- **Corrupted files**: Detección y re-upload

## Testing Strategy

### Unit Tests
- Image validation utilities
- Upload progress tracking
- Image processing functions
- Data transformation helpers

### Integration Tests
- Complete upload workflow
- Gallery navigation
- Mobile touch interactions
- Performance under load

### E2E Tests
- Admin product creation with multiple images
- Customer gallery interaction
- Image sharing functionality
- Mobile responsive behavior

### Performance Tests
- Large image upload handling
- Gallery loading with many images
- Concurrent upload scenarios
- Memory usage optimization

## Performance Optimizations

### Image Loading Strategy
1. **Catalog View**: Solo imagen principal (thumbnail)
2. **Product Detail**: Imagen principal + lazy load secundarias
3. **Gallery View**: Progressive loading basado en viewport

### Caching Strategy
- **Browser Cache**: Headers optimizados para imágenes
- **CDN Integration**: Distribución global de imágenes
- **Service Worker**: Cache offline de imágenes vistas

### Compression Settings
- **JPEG Quality**: 85% para balance calidad/tamaño
- **WebP Support**: Conversión automática cuando sea soportado
- **Responsive Images**: Múltiples tamaños según dispositivo

### Database Optimization
- **Indexes**: Optimizar consultas por productId y order
- **Aggregation**: Pipelines eficientes para catálogo
- **Pagination**: Limitar imágenes cargadas por request

## Migration Plan

### Phase 1: Backend Infrastructure
1. Actualizar tipos TypeScript
2. Crear nuevos endpoints API
3. Implementar image processing pipeline
4. Setup storage structure

### Phase 2: Admin Interface
1. Crear componente MultiImageUpload
2. Integrar en formularios de producto
3. Implementar reordenamiento
4. Testing con usuarios admin

### Phase 3: Customer Interface
1. Actualizar ProductImageGallery
2. Mejorar CatalogProductCard
3. Optimizar performance
4. Testing de experiencia usuario

### Phase 4: Migration & Cleanup
1. Migrar productos existentes
2. Cleanup de código legacy
3. Optimización final
4. Documentación completa

## Compatibility Considerations

### Backward Compatibility
- Mantener `imageUrl` field durante transición
- Fallback automático a imagen única
- API versioning para cambios breaking

### Mobile Optimization
- Touch gestures para navegación
- Optimización de tamaños de imagen
- Lazy loading agresivo en móviles

### Browser Support
- Progressive enhancement
- Fallbacks para navegadores antiguos
- Polyfills necesarios para drag & drop