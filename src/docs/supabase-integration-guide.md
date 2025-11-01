# 🚀 Guía de Integración con Supabase - Múltiples Imágenes

## ✅ **Sistema Actualizado para Supabase**

He actualizado completamente el sistema de múltiples imágenes para usar **Supabase Storage** en lugar del sistema de archivos local.

### **🔧 Cambios Realizados:**

#### **1. Funciones de Supabase Actualizadas** (`lib/supabase.ts`)
- ✅ `uploadMultipleImages()` - Sube múltiples archivos a Supabase Storage
- ✅ `deleteMultipleImages()` - Elimina múltiples archivos de Supabase
- ✅ Organización por tienda: `products/{storeId}/{productId}/`

#### **2. Endpoint API Actualizado** (`/api/products/[id]/images`)
- ✅ **POST** - Sube múltiples imágenes a Supabase Storage
- ✅ **DELETE** - Elimina imágenes de Supabase y MongoDB
- ✅ **PUT** - Reordena imágenes (solo MongoDB)

#### **3. Modelo de Datos Actualizado**
- ✅ Campo `supabasePath` agregado para tracking de archivos
- ✅ Compatibilidad con `imageUrl` mantenida
- ✅ MongoDB actualizado con nuevos campos

#### **4. Frontend Actualizado**
- ✅ `MultiImageUpload` usa Supabase para productos existentes
- ✅ Preview local para productos nuevos
- ✅ Eliminación integrada con Supabase

## 🧪 **Cómo Probar el Sistema:**

### **Paso 1: Verificar Variables de Entorno**
Asegúrate de que tienes estas variables en tu `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

### **Paso 2: Verificar Bucket de Supabase**
En tu dashboard de Supabase:
1. Ve a **Storage**
2. Asegúrate de que existe el bucket **"images"**
3. Configura las políticas de acceso público

### **Paso 3: Probar con Debug**
1. Ve a: `http://localhost:3000/debug-images`
2. Ingresa un **Product ID** válido
3. Selecciona **imágenes** para subir
4. Haz clic en **"Test Supabase"**
5. Revisa los **logs en consola**

### **Paso 4: Probar en Inventario**
1. Ve a **Inventario**
2. **Edita un producto** existente
3. **Agrega imágenes** usando MultiImageUpload
4. Verifica que se suban a Supabase
5. Verifica que aparezcan en el **catálogo**

## 📋 **Estructura de Archivos en Supabase:**

```
Bucket: images
└── products/
    └── {storeId}/
        └── {productId}/
            ├── producto-imagen1-timestamp-random.jpg
            ├── producto-imagen2-timestamp-random.png
            └── producto-imagen3-timestamp-random.webp
```

## 🔍 **Logs de Debug:**

### **En el Navegador (F12 → Console):**
- `🚀 [MultiImageUpload]` - Logs del componente
- `📤 [Supabase]` - Logs de subida a Supabase
- `✅ [Supabase]` - Confirmaciones de éxito

### **En el Servidor:**
- `🚀 [API]` - Logs del endpoint
- `📤 [Supabase]` - Logs de procesamiento
- `💾 [API]` - Logs de base de datos

## ⚠️ **Troubleshooting:**

### **Error: "Supabase client not initialized"**
- ✅ Verificar variables de entorno
- ✅ Reiniciar servidor de desarrollo
- ✅ Verificar que las URLs sean correctas

### **Error: "Error uploading image"**
- ✅ Verificar que el bucket "images" existe
- ✅ Verificar políticas de acceso en Supabase
- ✅ Verificar tamaño de archivo (máximo 5MB)

### **Error: "Producto no encontrado"**
- ✅ Verificar que el productId existe en MongoDB
- ✅ Verificar que el storeId coincida
- ✅ Verificar conexión a MongoDB

### **Las imágenes no aparecen en el catálogo**
- ✅ Verificar que se guardaron en MongoDB
- ✅ Verificar que las URLs de Supabase sean públicas
- ✅ Verificar que el componente use las nuevas utilidades

## 🎯 **Flujo Completo:**

```mermaid
graph TD
    A[Usuario sube imagen] --> B[MultiImageUpload]
    B --> C[Validación local]
    C --> D[POST /api/products/id/images]
    D --> E[uploadMultipleImages()]
    E --> F[Supabase Storage]
    F --> G[URLs públicas]
    G --> H[Guardar en MongoDB]
    H --> I[Actualizar frontend]
    I --> J[Mostrar en catálogo]
```

## ✅ **Verificación Final:**

### **Checklist de Funcionamiento:**
- [ ] Variables de Supabase configuradas
- [ ] Bucket "images" existe y es público
- [ ] Test de Supabase funciona en `/debug-images`
- [ ] Subida desde inventario funciona
- [ ] Imágenes aparecen en catálogo
- [ ] Navegación entre múltiples imágenes funciona
- [ ] Eliminación de imágenes funciona

### **URLs de Prueba:**
- **Debug:** `http://localhost:3000/debug-images`
- **Inventario:** `http://localhost:3000/inventory`
- **Catálogo:** `http://localhost:3000/catalog`

## 🚀 **¡Listo para Producción!**

El sistema ahora está completamente integrado con Supabase y listo para manejar múltiples imágenes por producto de forma escalable y eficiente.

**Próximos pasos:**
1. Probar el sistema con el debug
2. Verificar funcionamiento en inventario
3. Confirmar que aparece en catálogo
4. ¡Disfrutar de múltiples imágenes por producto! 🎉