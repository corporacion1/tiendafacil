# Guía del Sistema de Múltiples Imágenes

## Resumen

El sistema de múltiples imágenes permite a los productos tener hasta 4 imágenes, mejorando la experiencia visual del catálogo mientras mantiene compatibilidad completa con el sistema existente.

## Características Principales

### ✅ Funcionalidades Implementadas

- **Múltiples imágenes por producto** (hasta 4)
- **Drag & drop interface** para subida de imágenes
- **Validación automática** de formato y tamaño
- **Compresión y thumbnails** automáticos
- **Galería interactiva** con navegación
- **Zoom modal** con navegación por teclado
- **Gestos táctiles** para móviles
- **Compatibilidad completa** con productos existentes
- **Migración automática** de datos
- **Compartir imágenes específicas**

### 🔧 Componentes Principales

#### 1. MultiImageUpload
Componente para gestión de imágenes en formularios de administración.

```tsx
import { MultiImageUpload } from '@/components/multi-image-upload';

<MultiImageUpload
  productId="product-123"
  existingImages={product.images}
  maxImages={4}
  onImagesChange={(images) => setProduct({...product, images})}
  onError={(error) => console.error(error)}
/>
```

#### 2. ProductImageGallery
Galería interactiva para mostrar imágenes a los clientes.

```tsx
import { ProductImageGallery } from '@/components/product-image-gallery';

<ProductImageGallery
  product={product}
  showThumbnails={true}
  onImageShare={(url, name) => shareImage(url, name)}
/>
```

#### 3. Hook useProductImages
Hook para manejar imágenes con compatibilidad automática.

```tsx
import { useProductImages } from '@/hooks/use-product-images';

const {
  images,
  primaryImageUrl,
  hasMultiple,
  imageCount,
  isEmpty
} = useProductImages(product);
```

## Uso en Componentes Existentes

### Actualizar CatalogProductCard

```tsx
// Antes
const imageUrl = getDisplayImageUrl(product.imageUrl);

// Después
const { primaryImageUrl, hasMultiple, imageCount } = useProductImages(product);
const imageUrl = getDisplayImageUrl(primaryImageUrl);

// Mostrar indicador de múltiples imágenes
{hasMultiple && (
  <Badge>{currentIndex + 1}/{imageCount}</Badge>
)}
```

### Actualizar Modal de Detalles

```tsx
// Reemplazar imagen única con galería
<ProductImageGallery
  product={product}
  showThumbnails={true}
  onImageShare={handleImageShare}
/>
```

## Migración de Datos

### Migración Automática

```tsx
import { migrateStoreProducts } from '@/lib/product-migration';

// Migrar todos los productos de una tienda
const result = await migrateStoreProducts(storeId, (progress) => {
  console.log(`Progreso: ${progress.processedProducts}/${progress.totalProducts}`);
});
```

### Verificar Estado de Migración

```tsx
import { checkMigrationStatus } from '@/lib/product-migration';

const status = await checkMigrationStatus(storeId);
console.log(`${status.migratedProducts}/${status.totalProducts} productos migrados`);
```

## Compatibilidad

### Campos Mantenidos

El sistema mantiene los campos existentes para compatibilidad:

```tsx
type Product = {
  // Campos existentes (mantenidos)
  imageUrl?: string;        // URL de imagen principal
  imageHint?: string;       // Texto alternativo
  
  // Nuevos campos
  images?: ProductImage[];  // Array de imágenes
  primaryImageIndex?: number; // Índice de imagen principal
}
```

### Funciones de Compatibilidad

```tsx
import { 
  getPrimaryImageUrl,
  getAllProductImages,
  hasMultipleImages,
  getImageCount 
} from '@/lib/product-image-utils';

// Obtener imagen principal (compatible con imageUrl)
const primaryUrl = getPrimaryImageUrl(product);

// Verificar si tiene múltiples imágenes
const hasMultiple = hasMultipleImages(product);

// Obtener todas las imágenes como array
const allImages = getAllProductImages(product);
```

## Validaciones

### Configuración de Validación

```tsx
// lib/image-validation.ts
export const IMAGE_VALIDATION_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_PRODUCT: 4,
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MIN_DIMENSIONS: { width: 100, height: 100 },
  MAX_DIMENSIONS: { width: 4000, height: 4000 }
};
```

### Validar Imágenes

```tsx
import { validateMultipleImageFiles } from '@/lib/image-validation';

const validation = await validateMultipleImageFiles(files, existingCount);

if (validation.validFiles.length > 0) {
  // Procesar archivos válidos
}

if (validation.invalidFiles.length > 0) {
  // Mostrar errores
  validation.invalidFiles.forEach(({file, errors}) => {
    console.error(`${file.name}: ${errors.join(', ')}`);
  });
}
```

## Procesamiento de Imágenes

### Compresión Automática

```tsx
import { processImage } from '@/lib/image-processing';

const processed = await processImage(file);
// processed.compressed - Imagen comprimida
// processed.thumbnail - Thumbnail generado
// processed.dimensions - Dimensiones originales
```

### Configuración de Procesamiento

```tsx
// lib/image-processing.ts
export const IMAGE_PROCESSING_CONFIG = {
  COMPRESSION_QUALITY: 0.85,     // 85% calidad
  MAX_COMPRESSED_WIDTH: 1200,    // Ancho máximo
  MAX_COMPRESSED_HEIGHT: 1200,   // Alto máximo
  THUMBNAIL_SIZE: 150,           // Tamaño de thumbnail
};
```

## Optimizaciones de Rendimiento

### Lazy Loading

```tsx
// Las imágenes secundarias se cargan solo cuando son necesarias
const { optimizedImageUrl } = useOptimizedImageLoading(product, isVisible);
```

### Preload Inteligente

```tsx
// Precargar imágenes de productos prioritarios
usePreloadProductImages(products, isPriority);
```

### Caché de Imágenes

```tsx
// Las imágenes procesadas se cachean automáticamente
// Los thumbnails se generan una sola vez
// El navegador cachea las imágenes optimizadas
```

## Ejemplos de Uso

### Componente de Producto Completo

```tsx
function ProductCard({ product }) {
  const { 
    primaryImageUrl, 
    hasMultiple, 
    imageCount 
  } = useProductImages(product);

  return (
    <Card>
      <div className="relative">
        <img src={primaryImageUrl} alt={product.name} />
        {hasMultiple && (
          <Badge className="absolute top-2 right-2">
            1/{imageCount}
          </Badge>
        )}
      </div>
      <CardContent>
        <h3>{product.name}</h3>
        <p>${product.price}</p>
      </CardContent>
    </Card>
  );
}
```

### Formulario de Producto

```tsx
function ProductForm({ product, onSave }) {
  const [formData, setFormData] = useState(product);

  const handleImagesChange = (images) => {
    setFormData(prev => ({
      ...prev,
      images,
      // Actualizar campos de compatibilidad
      imageUrl: images[0]?.url,
      imageHint: images[0]?.alt
    }));
  };

  return (
    <form onSubmit={() => onSave(formData)}>
      {/* Otros campos del formulario */}
      
      <MultiImageUpload
        productId={formData.id}
        existingImages={formData.images}
        onImagesChange={handleImagesChange}
        onError={console.error}
      />
      
      <button type="submit">Guardar</button>
    </form>
  );
}
```

## Troubleshooting

### Problemas Comunes

1. **Imágenes no se muestran**
   - Verificar que las URLs sean accesibles
   - Comprobar configuración de CORS
   - Revisar permisos de archivos

2. **Error en validación**
   - Verificar formato de archivo (JPG, PNG, WebP)
   - Comprobar tamaño (máximo 5MB)
   - Revisar dimensiones mínimas/máximas

3. **Problemas de rendimiento**
   - Activar lazy loading
   - Usar thumbnails para navegación
   - Implementar preload selectivo

### Logs de Debug

```tsx
// Activar logs detallados
localStorage.setItem('debug-images', 'true');

// Los componentes mostrarán información de debug en consola
```

## Roadmap Futuro

### Mejoras Planificadas

- [ ] Soporte para más formatos (AVIF, HEIC)
- [ ] Edición básica de imágenes (crop, rotate)
- [ ] Watermarks automáticos
- [ ] Integración con CDN
- [ ] Análisis de rendimiento de imágenes
- [ ] Compresión adaptativa según conexión

### APIs Futuras

- [ ] Endpoint para batch upload
- [ ] API de análisis de imágenes
- [ ] Integración con servicios de optimización
- [ ] Backup automático de imágenes

## Soporte

Para problemas o preguntas sobre el sistema de múltiples imágenes:

1. Revisar esta documentación
2. Verificar los logs de consola
3. Comprobar la configuración de validación
4. Revisar el estado de migración de datos

El sistema está diseñado para ser robusto y mantener compatibilidad completa con el código existente.