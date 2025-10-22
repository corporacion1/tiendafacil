# 🚀 Configuración de Supabase para Upload de Imágenes

Supabase es una alternativa gratuita y global a Cloudinary que funciona en cualquier país.

## 📋 **Paso 1: Crear cuenta en Supabase**

### 1.1 Ir al sitio web
1. Ve a: **https://supabase.com**
2. Haz clic en **"Start your project"**

### 1.2 Registro
Puedes registrarte con:
- ✅ **GitHub** (recomendado)
- ✅ **Google**
- ✅ **Email**

### 1.3 Crear proyecto
1. Haz clic en **"New Project"**
2. **Name**: `tiendafacil-images`
3. **Database Password**: Genera una contraseña segura
4. **Region**: Selecciona la más cercana a tu país
5. Haz clic en **"Create new project"**

⏱️ **Espera 2-3 minutos** mientras se crea el proyecto.

## 🗂️ **Paso 2: Configurar Storage**

### 2.1 Crear bucket para imágenes
1. En el panel izquierdo, haz clic en **"Storage"**
2. Haz clic en **"Create a new bucket"**
3. **Name**: `images`
4. **Public bucket**: ✅ **Activar** (para que las imágenes sean públicas)
5. Haz clic en **"Create bucket"**

### 2.2 Configurar políticas de acceso
1. Ve a **Storage** → **Policies**
2. Para el bucket `images`, haz clic en **"New Policy"**
3. Selecciona **"For full customization"**
4. **Policy name**: `Allow public uploads`
5. **Allowed operation**: `INSERT`
6. **Policy definition**:
```sql
true
```
7. Haz clic en **"Review"** → **"Save policy"**

8. Crear otra política para lectura:
   - **Policy name**: `Allow public access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: `true`

## 🔑 **Paso 3: Obtener credenciales**

### 3.1 Ir a configuración
1. Haz clic en **"Settings"** (⚙️) en el panel izquierdo
2. Selecciona **"API"**

### 3.2 Copiar credenciales
Verás dos valores importantes:
```
Project URL: https://tu-proyecto.supabase.co
anon public: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 🔧 **Paso 4: Configurar en tu proyecto**

### 4.1 Actualizar .env
Reemplaza en tu archivo `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 4.2 Reiniciar servidor
```bash
# Detener servidor (Ctrl+C)
npm run dev
```

## 🧪 **Paso 5: Probar el sistema**

### 5.1 Probar upload
1. Ve a **http://localhost:3000**
2. Inicia sesión como admin
3. Ve a **Configuración** → **Productos**
4. Haz clic en **"Agregar Producto"**
5. Sube una imagen de prueba

### 5.2 Verificar en Supabase
1. Ve a tu proyecto en Supabase
2. **Storage** → **images** → **products**
3. Deberías ver tu imagen subida

## 🚂 **Paso 6: Railway Deployment**

### 6.1 Variables de entorno en Railway
Cuando hagas deploy en Railway, agrega estas variables:

```env
MONGO_URI=tu_mongo_uri
JWT_SECRET=tu_jwt_secret
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NODE_ENV=production
```

## ✅ **Ventajas de Supabase**

- 🌍 **Disponible mundialmente**
- 💰 **Gratuito**: 1GB de almacenamiento
- 🚀 **CDN automático**: Carga rápida global
- 🔒 **Seguro**: Políticas de acceso configurables
- 📊 **Dashboard**: Ve estadísticas de uso
- 🔄 **Backup automático**: Nunca pierdes imágenes

## 🆘 **Troubleshooting**

### Error: "Row Level Security"
- Ve a **Storage** → **Policies**
- Asegúrate de tener políticas para `INSERT` y `SELECT`

### Error: "Bucket not found"
- Verifica que el bucket se llame exactamente `images`
- Asegúrate de que sea público

### Error de CORS
- Supabase maneja CORS automáticamente
- Si hay problemas, verifica las URLs en `.env`

## 🎉 **¡Listo!**

Una vez configurado, tendrás:
- ✅ Upload de imágenes funcionando
- ✅ Almacenamiento en la nube
- ✅ CDN global para carga rápida
- ✅ 1GB gratuito de almacenamiento
- ✅ Compatible con Railway