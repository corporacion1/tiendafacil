# 🚀 Deployment en Railway

Esta guía te ayudará a desplegar tu aplicación TiendaFácil en Railway con soporte completo para upload de imágenes.

## 📋 Prerrequisitos

1. **Cuenta en Railway**: [railway.app](https://railway.app)
2. **Cuenta en Cloudinary**: [cloudinary.com](https://cloudinary.com) (gratis hasta 25GB)
3. **Base de datos MongoDB**: Ya configurada en MongoDB Atlas

## 🔧 Configuración de Cloudinary

### 1. Crear cuenta en Cloudinary
1. Ve a [cloudinary.com](https://cloudinary.com)
2. Crea una cuenta gratuita
3. Ve al Dashboard y copia:
   - **Cloud Name**
   - **API Key** 
   - **API Secret**

### 2. Configurar variables de entorno
En tu archivo `.env` local, actualiza:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## 🚂 Deployment en Railway

### 1. Conectar repositorio
1. Ve a [railway.app](https://railway.app)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio

### 2. Configurar variables de entorno en Railway
En el dashboard de Railway, ve a Variables y agrega:

```env
MONGO_URI=mongodb+srv://corporacion1:19a1e3ef@cluster0.bdebogw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=8xK!pL9#mNvB2$qW
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
NODE_ENV=production
```

### 3. Configuración automática
Railway detectará automáticamente que es una aplicación Next.js y:
- ✅ Instalará las dependencias con `npm ci`
- ✅ Ejecutará el build con `npm run build`
- ✅ Iniciará la aplicación con `npm start`

## 🖼️ Funcionalidades de Imágenes

### Upload de Imágenes
- ✅ **Subida directa**: Los usuarios pueden subir imágenes desde el formulario de productos
- ✅ **Optimización automática**: Las imágenes se redimensionan y optimizan automáticamente
- ✅ **Formatos modernos**: Conversión automática a WebP cuando es posible
- ✅ **CDN global**: Cloudinary proporciona un CDN para carga rápida mundial

### Límites y Características
- **Tamaño máximo**: 5MB por imagen
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Redimensionamiento**: Máximo 800x600px automáticamente
- **Almacenamiento gratuito**: 25GB en Cloudinary

## 🔄 Proceso de Deployment

1. **Push a GitHub**: Sube tus cambios al repositorio
2. **Auto-deploy**: Railway detecta los cambios y despliega automáticamente
3. **Build time**: ~2-3 minutos
4. **URL disponible**: Railway te proporciona una URL pública

## 🛠️ Comandos útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Verificar build
npm run build && npm start
```

## 📊 Monitoreo

Railway proporciona:
- ✅ **Logs en tiempo real**
- ✅ **Métricas de rendimiento**
- ✅ **Reinicio automático** en caso de errores
- ✅ **SSL automático** (HTTPS)

## 🔧 Troubleshooting

### Error de build
```bash
# Verificar localmente
npm run build
```

### Error de variables de entorno
- Verifica que todas las variables estén configuradas en Railway
- Asegúrate de que no haya espacios extra en los valores

### Error de Cloudinary
- Verifica las credenciales en el dashboard de Cloudinary
- Asegúrate de que la cuenta esté activa

## 🎉 ¡Listo!

Una vez desplegado, tu aplicación estará disponible en:
`https://tu-app.railway.app`

Con todas las funcionalidades:
- 🛍️ Catálogo de productos
- 📦 Gestión de inventario
- 💰 Punto de venta
- 🖼️ Upload de imágenes
- 📊 Reportes y analytics