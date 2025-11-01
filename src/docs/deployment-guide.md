# Guía de Despliegue - Sistema de Múltiples Imágenes

## 🚀 Preparación para Producción

### 1. Verificar Archivos Actualizados

Asegúrate de que estos archivos estén actualizados en tu repositorio:

#### Modelos y Tipos
- ✅ `lib/types.ts` - Tipos actualizados con ProductImage
- ✅ `models/Product.ts` - Esquema de MongoDB actualizado
- ✅ `lib/product-image-utils.ts` - Utilidades de compatibilidad
- ✅ `lib/image-validation.ts` - Validación de archivos
- ✅ `lib/image-processing.ts` - Procesamiento de imágenes
- ✅ `lib/image-storage.ts` - Configuración de almacenamiento

#### APIs Backend
- ✅ `app/api/products/[id]/images/route.ts` - Gestión de múltiples imágenes
- ✅ `app/api/products/migrate-images/route.ts` - Migración de datos
- ✅ `app/api/products/route.ts` - API principal (sin cambios necesarios)

#### Componentes Frontend
- ✅ `components/multi-image-upload.tsx` - Subida de múltiples imágenes
- ✅ `components/product-image-gallery.tsx` - Galería interactiva
- ✅ `components/product-form.tsx` - Formulario actualizado
- ✅ `components/migration-manager.tsx` - Gestión de migración
- ✅ `hooks/use-product-images.ts` - Hook personalizado

#### Páginas Actualizadas
- ✅ `app/catalog/page.tsx` - Catálogo con múltiples imágenes
- ✅ `app/inventory/page.tsx` - Usa ProductForm actualizado

### 2. Crear Directorios de Almacenamiento

```bash
# Crear estructura de directorios para imágenes
mkdir -p public/uploads/products
chmod 755 public/uploads/products
```

### 3. Variables de Entorno

Agregar a tu archivo `.env.local`:

```env
# Configuración de almacenamiento de imágenes
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/jpg,image/png,image/webp
UPLOAD_BASE_DIR=public/uploads/products

# Configuración de procesamiento (opcional)
IMAGE_QUALITY=85
THUMBNAIL_SIZE=150
COMPRESSED_MAX_WIDTH=1200
COMPRESSED_MAX_HEIGHT=1200
```

### 4. Dependencias Opcionales

Para mejor procesamiento de imágenes (recomendado para producción):

```bash
npm install sharp
# o
yarn add sharp
```

Si instalas Sharp, descomenta la línea en `app/api/products/[id]/images/route.ts`:
```typescript
import sharp from 'sharp'; // Descomentar esta línea
```

## 📋 Pasos de Despliegue

### Paso 1: Backup de Base de Datos

```bash
# Crear backup antes del despliegue
mongodump --uri="tu-connection-string" --out=backup-$(date +%Y%m%d)
```

### Paso 2: Desplegar Código

```bash
# 1. Hacer commit de todos los cambios
git add .
git commit -m "feat: implement multiple product images system"

# 2. Push a producción
git push origin main

# 3. Deploy según tu plataforma (Vercel, Netlify, etc.)
```

### Paso 3: Verificar Despliegue

1. **Verificar APIs**:
   - `GET /api/products/migrate-images?storeId=tu-store-id`
   - Debería devolver el estado de migración

2. **Verificar Directorios**:
   - Asegúrate de que `public/uploads/products` existe
   - Verificar permisos de escritura

3. **Verificar Frontend**:
   - Abrir página de inventario
   - Editar un producto existente
   - Verificar que aparece el componente de múltiples imágenes

### Paso 4: Ejecutar Migración

#### Opción A: Desde el Frontend (Recomendado)

1. Ir a la página de inventario
2. Agregar el componente MigrationManager temporalmente
3. Ejecutar migración desde la interfaz

#### Opción B: Desde API Directamente

```bash
curl -X POST "https://tu-dominio.com/api/products/migrate-images" \
  -H "Content-Type: application/json" \
  -d '{"storeId": "tu-store-id"}'
```

#### Opción C: Script de Migración

```javascript
// scripts/migrate-images.js
const fetch = require('node-fetch');

async function migrateStore(storeId) {
  try {
    const response = await fetch('https://tu-dominio.com/api/products/migrate-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId })
    });
    
    const result = await response.json();
    console.log(`Migración completada para ${storeId}:`, result);
  } catch (error) {
    console.error(`Error migrando ${storeId}:`, error);
  }
}

// Ejecutar para todas las tiendas
const storeIds = ['store1', 'store2', 'store3'];
storeIds.forEach(migrateStore);
```

## 🔍 Verificación Post-Despliegue

### 1. Verificar Migración

```bash
# Verificar estado de migración
curl "https://tu-dominio.com/api/products/migrate-images?storeId=tu-store-id"
```

Respuesta esperada:
```json
{
  "storeId": "tu-store-id",
  "totalProducts": 100,
  "migratedProducts": 100,
  "pendingProducts": 0,
  "migrationComplete": true,
  "migrationPercentage": 100
}
```

### 2. Probar Funcionalidades

#### Subida de Múltiples Imágenes
1. Editar un producto existente
2. Agregar 2-3 imágenes adicionales
3. Verificar que se suben correctamente
4. Verificar que aparecen en el catálogo

#### Galería de Imágenes
1. Ver producto en el catálogo
2. Hacer clic para ver detalles
3. Verificar navegación entre imágenes
4. Probar zoom modal

#### Compatibilidad
1. Verificar que productos migrados mantienen su imagen original
2. Verificar que el catálogo muestra correctamente
3. Verificar que la funcionalidad de compartir funciona

### 3. Monitoreo

#### Logs a Revisar
```bash
# Verificar logs de migración
grep "Migration" /var/log/app.log

# Verificar logs de subida de imágenes
grep "product-images" /var/log/app.log

# Verificar errores
grep "ERROR" /var/log/app.log | grep -i image
```

#### Métricas a Monitorear
- Tiempo de carga de páginas con múltiples imágenes
- Uso de almacenamiento en `/uploads/products`
- Errores en APIs de imágenes
- Tiempo de respuesta de subida de archivos

## 🛠️ Troubleshooting

### Problema: Migración No Funciona

**Síntomas**: Error 500 en `/api/products/migrate-images`

**Soluciones**:
1. Verificar conexión a MongoDB
2. Verificar permisos de escritura en base de datos
3. Revisar logs del servidor

### Problema: No Se Pueden Subir Imágenes

**Síntomas**: Error al subir archivos

**Soluciones**:
1. Verificar que existe `public/uploads/products`
2. Verificar permisos de escritura: `chmod 755 public/uploads/products`
3. Verificar límites de tamaño de archivo en servidor
4. Verificar configuración de Next.js para archivos estáticos

### Problema: Imágenes No Se Muestran

**Síntomas**: URLs de imágenes devuelven 404

**Soluciones**:
1. Verificar que las imágenes se guardaron correctamente
2. Verificar configuración de archivos estáticos en Next.js
3. Verificar que las URLs generadas son correctas

### Problema: Performance Lenta

**Síntomas**: Páginas cargan lentamente con múltiples imágenes

**Soluciones**:
1. Instalar y configurar Sharp para compresión
2. Implementar CDN para servir imágenes
3. Optimizar lazy loading
4. Reducir tamaño máximo de imágenes

## 📈 Optimizaciones Futuras

### 1. CDN Integration
```javascript
// Configurar CDN para imágenes
const CDN_BASE_URL = process.env.CDN_BASE_URL;

function getCDNUrl(imagePath) {
  return CDN_BASE_URL ? `${CDN_BASE_URL}${imagePath}` : imagePath;
}
```

### 2. Compresión Avanzada
```bash
# Instalar herramientas adicionales
npm install imagemin imagemin-mozjpeg imagemin-pngquant
```

### 3. Análisis de Uso
```javascript
// Agregar analytics de imágenes
function trackImageView(productId, imageIndex) {
  analytics.track('image_viewed', {
    productId,
    imageIndex,
    timestamp: Date.now()
  });
}
```

## ✅ Checklist Final

- [ ] Código desplegado en producción
- [ ] Directorios de almacenamiento creados
- [ ] Variables de entorno configuradas
- [ ] Backup de base de datos realizado
- [ ] Migración ejecutada exitosamente
- [ ] Funcionalidades probadas
- [ ] Monitoreo configurado
- [ ] Documentación actualizada
- [ ] Equipo notificado de los cambios

## 🆘 Rollback Plan

Si algo sale mal, puedes hacer rollback:

### 1. Rollback de Código
```bash
git revert HEAD
git push origin main
```

### 2. Rollback de Base de Datos
```bash
# Restaurar desde backup
mongorestore --uri="tu-connection-string" backup-fecha/
```

### 3. Verificar Funcionalidad
- Verificar que el sistema funciona con imagen única
- Verificar que no hay errores en el catálogo
- Verificar que los formularios funcionan correctamente

---

**¡El sistema de múltiples imágenes está listo para producción!** 🎉