# 🏪 TiendaFácil - Sistema Integral de Comercio Digital

<div align="center">

![TiendaFácil Logo](public/tienda_facil_logo.svg)

**Versión 1.4.0** | **Enero 2026**
  
 *Sistema completo de Punto de Venta, Inventario y Comercio Electrónico*

## 🚀 **Nuevas Características - Versión 1.4.0**

### 🚚 **Sistema Integral de Entregas (Deliveries)**
- **Gestión de Zonas**: Definición de zonas de entrega con nombres, coordenadas y tarifas base
- **Proveedores de Delivery**: Registro y administración de proveedores de mensajería
- **Reglas de Tarifa**: Configuración dinámica de fees por zonas, pesos y condiciones especiales
- **Historial de Entregas**: Seguimiento completo de cada entrega con estado en tiempo real
- **Notificaciones**: Sistema de notificaciones para clientes y proveedores

### 💳 **Sistema de Créditos y Cuentas por Cobrar**
- **Gestión de Créditos**: Registro y seguimiento de ventas a crédito
- **Pagos Parciales**: Soporte para abonos y saldo pendiente
- **Días de Crédito**: Configuración flexible de plazos de pago
- **Reportes de Cartera**: Análisis de cuentas por cobrar con antigüedad
- **Vencimientos**: Seguimiento automático de fechas de vencimiento

### 📊 **Módulo de Reportes Avanzado**
- **Reportes de Ventas**: Análisis detallado por período, producto y categoría
- **Reporte de Inventario**: Stock actual, movimientos y valoraciones
- **Reporte de Créditos**: Estado de cartera y morosidad
- **Reportes de Gastos**: Análisis de pagos y categorización
- **Exportación**: Generación de reportes en múltiples formatos

### 📢 **Sistema de Publicidades (Ads)**
- **Gestión de Anuncios**: Creación y administración de campañas publicitarias
- **Posiciones Múltiples**: Anuncios en diferentes secciones de la aplicación
- **Programación**: Fechas de inicio y fin para campañas
- **Estadísticas**: Seguimiento de impresiones y clics
- **Imagenes**: Soporte para múltiples imágenes por anuncio

### 📦 **Mejoras en Inventario**
- **Historial de Movimientos**: Registro detallado de todas las operaciones
- **Categorización**: Clasificación mejorada de productos
- **Alertas de Stock**: Notificaciones por stock mínimo
- **Valoración de Inventario**: Cálculo de valor total del inventario

### 🛒 **Módulo de Compras (Purchases)**
- **Órdenes de Compra**: Registro de compras a proveedores
- **Entrada de Inventario**: Vinculación automática con movimientos
- **Historial de Precios**: Seguimiento de costos por producto
- **Proveedores**: Gestión completa de proveedores

### 👥 **Gestión de Usuarios Avanzada**
- **Listado Completo**: Vista tabular de todos los usuarios
- **Edición de Perfiles**: Modificación de datos de usuarios
- **Roles y Permisos**: Control granular de accesos
- **Promoción de Usuarios**: Conversión de usuarios a administradores
- **Búsqueda y Filtros**: Búsqueda rápida por nombre o email

### 🛠️ **Mejoras Técnicas**

#### **Sistema de Migraciones**
- **Migraciones Automáticas**: Herramienta para migrar datos de MongoDB a Supabase
- **Validación de Datos**: Verificación de integridad durante migración
- **Logs de Progreso**: Seguimiento detallado del proceso
- **Rollback**: Posibilidad de revertir migraciones

#### **Optimización de Base de Datos**
- **Índices Optimizados**: Mejora en rendimiento de consultas
- **Limpieza de Datos**: Eliminación de registros huérfanos
- **Tipos de Datos**: Corrección de tipos para Supabase

#### **Mejoras en el POS**
- **Auto-Sync**: Sincronización automática de pedidos pendientes
- **Validaciones**: Verificación mejorada de estados
- **UX Optimizada**: Flujo más fluido en el punto de venta

### ✨ **Características Anteriores (v1.3.0)**

### 🏷️ **Sistema de Descuentos en POS**
- **Flexibilidad Total**: Soporte para descuentos por monto fijo ($) o porcentaje (%).
- **Seguridad Integrada**: Autorización mediante PIN para aplicar descuentos.
- **Auditoría**: Campo de notas obligatorio para justificar descuentos.
- **Registro Detallado**: Persistencia del monto descontado y notas en cada venta.

### 📦 **Gestión de Inventario y Excel**
- **Importación/Exportación Excel**: Funcionalidad robusta para manejo masivo de inventario mediante archivos `.xlsx` (Excel).
- **Validación de Datos**: Detección de errores y duplicados al importar productos.
- **Correcciones de Almacén**: Selección precisa de almacenes durante la edición de productos y correcciones visuales en historial.

### 📊 **Visualización y Reportes**
- **Gráfico de Ventas vs Pagos**: Nueva visualización comparativa en el Dashboard para análisis financiero rápido.
- **Etiquetas de Impuestos**: Visualización clara de precios con impuesto en detalles del producto.

### 💰 **Categorías de Pagos Expandidas**
- **Nuevas Categorías**: Inclusión de 'Repuestos', 'Reparaciones' y 'Viáticos' para un mejor control de gastos operativos.

### ✨ **Características Anteriores (v1.2.6)**

### 🏪 **Series de Venta Locales (Local POS Series)**
- **Configuración por Dispositivo**: Cada caja/dispositivo puede tener su propia serie (ej. POS-A, CAJA-1) y correlativo independiente.
- **Persistencia Local**: Uso de `localStorage` para mantener la secuencia incluso mas allá de las sesiones.
- **Control de SuperUsuario**: Interfaz de configuración bloqueada y solo visible para usuarios con rol `su`.
- **Visibilidad Mejorada**: Indicadores claros en el carrito y en el modal de confirmación de venta.

### 💳 **Gestión de Créditos y Cuentas por Cobrar**
- **Persistencia Robusta**: Solución definitiva para la persistencia de `credit_days` y `paid_amount` en ventas a crédito.
- **Sincronización Exacta**: Migración de trigger SQL a lógica de API explícita para crear registros en `account_receivables`.
- **Manejo de Pagos Parciales**: Cálculo preciso de "Saldo Pendiente" al momento de la venta.
- **Visualización Corrigida**: La fecha de vencimiento y días de crédito se muestran correctamente en el módulo de Créditos.

### 🔄 **Optimización de Flujo de Pedidos**
- **Auto-Procesamiento**: Al cargar un **Pedido Pendiente** al carrito, este se marca automáticamente como `processed`.
- **Limpieza de Lista**: El pedido desaparece inmediatamente de la lista "Pendientes", evitando duplicidad y errores operativos.
- **Validación de Estado**: Doble verificación al finalizar la venta para asegurar que el pedido cambie de estado.

### 🛠️ **Limpieza Técnica**
- **Optimización de Base de Datos**: Eliminación de columnas redundantes en tabla `sales`.
- **API Refactor**: Limpieza de código duplicado y mejora en el manejo de transacciones.

### ✨ **Características Anteriores (v1.2.5)**
 
+###  **Gestión Avanzada de Inventario con Excel (Mejorado v1.2.5)**
+- **Campos Extendidos**: Soporte completo para "Descripción" y "Tipo" en importación/exportación.
+- **Detección Inteligente de Tipo**: Admite valores de texto ("Producto"/"Servicio") y booleanos.
+- **Seguridad en Importación**: Nuevo modal de confirmación con vista previa estadística.
+- **Resumen de Cambios**: Muestra conteo exacto de productos nuevos, actualizaciones y errores antes de procesar.
+- **Validación Robusta**: Prevención de carga de archivos corruptos o mal formateados.
+
+### ✨ **Características Anteriores (v1.2.4)**
+
 ### ✨ **Optimización y Rendimiento Critico**
 
 #### ⚡ **Sistema de Caché Inteligente (Smart Caching)**
 - **Reducción de Egress**: Implementación de `unstable_cache` en endpoints críticos (`/api/products`, `/api/orders`) para minimizar el consumo de ancho de banda y lecturas a la base de datos (Supabase).
 - **Actualizaciones en Tiempo Real**: Lógica de invalidación de caché (`revalidateTag`) activada automáticamente al crear, editar o eliminar productos y pedidos.
@@ -109,10 +120,6 @@
 - **Estabilidad**: El sistema es más resistente a intermitencias de red menores gracias al caché local.
 
-### ✨ **Características Anteriores (v1.2.3)**
-
-### ✨ **Funcionalidades Recién Agregadas**
-
-####  **Gestión Avanzada de Inventario con Excel**
-- **Importación Masiva**: Carga de productos desde Excel (`.xlsx`) con creación y actualización automática.
-- **Exportación Nativa**: Descarga directa de inventario en formato Excel (`.xlsx`).
-- **Validación Automática**: Detección inteligente de duplicados y errores durante la importación.


#### 📈 **Nuevos Módulos de Análisis**
- **Gráfico de Ventas vs Pagos**: Visualización comparativa en el Dashboard principal.
- **Análisis Financiero**: Monitoreo en tiempo real del flujo de caja (Ingresos vs Gastos).

#### 🔄 **Mejoras de Flujo de Trabajo**
- **Redirección Inteligente**:
  - Al crear producto -> Redirige automáticamente al inventario.
  - Al editar producto -> Cierra el modal y actualiza la lista.
- **Optimización de UX**: Menos clics para realizar tareas comunes.

#### 🛠️ **Correcciones y Optimizaciones**
- **Seguridad**: Actualización de Next.js y React para mitigar vulnerabilidades (CVE-2025-66478).
- **Tipado Estricto**: Corrección de errores de TypeScript en módulos de ventas y pagos.
- **Estabilidad**: Solución a problemas de validación en formularios de productos.

### ✨ **Funcionalidades Anteriores (v1.2.2)**

#### �💳 **Módulo de Pagos y Gastos Generales**
- **Sistema Completo de Pagos**: Nuevo módulo para registrar gastos del negocio separado de compras de inventario
- **Gestión de Destinatarios**: Base de datos de proveedores y destinatarios con información completa (RIF, teléfono, email)
- **6 Categorías de Gastos**: Alquiler, Combustible, Consumibles, Materia Prima, Servicios, Otros
- **5 Métodos de Pago**: Efectivo, Transferencia, Tarjeta, Cheque, Otro
- **Historial Avanzado**: Tabla con filtros por categoría, búsqueda por destinatario/notas, y cálculo automático de totales
- **Campos Completos**: Fecha, monto, número de documento, responsable, notas
- **Sin Impacto en Inventario**: Los pagos no afectan el stock de productos
- **Integración con Supabase**: Almacenamiento persistente en PostgreSQL

#### 🔐 **Mejoras en Seguridad y Configuración**
- **Zona de Peligro Refinada**: Botones de reinicio y producción con funcionalidad mejorada
- **Reiniciar**: Solo elimina datos transaccionales, mantiene configuración
- **Pasar a Producción**: Solo cambia estado, sin eliminación de datos
- **Verificación de PIN Mejorada**: Manejo correcto cuando no hay PIN configurado

#### 📊 **Administración de Tiendas Mejorada**
- **Conteo de Producción Correcto**: Dashboard muestra correctamente tiendas en modo producción
- **Badges de Estado**: Indicadores visuales precisos (Activa, Inactiva, En Producción)
- **Lista de Tiendas Recientes**: Muestra estado correcto de tiendas recientes

### ✨ **Funcionalidades Anteriores (v1.1.10.3)**

#### 🖼️ **Sistema Multi-Imágenes para Productos**
- **Galería de Imágenes**: Soporte completo para múltiples imágenes por producto
- **Gestión Visual**: Interfaz intuitiva para agregar, reordenar y eliminar imágenes
- **Vista Previa Avanzada**: Carrusel de imágenes con navegación fluida
- **Imagen Principal**: Selección automática de la primera imagen como principal
- **Optimización de Carga**: Lazy loading y compresión automática de imágenes
- **Responsive Design**: Galería adaptativa para todos los dispositivos

#### 🔐 **Funcionalidad de Mostrar/Ocultar Contraseña**
- **Toggle Visual**: Botón con iconos Eye/EyeOff para alternar visibilidad
- **Modal de Login**: Funcionalidad integrada en el formulario de inicio de sesión
- **Modal de Registro**: Disponible también en el formulario de registro
- **UX Mejorada**: Reducción de errores de entrada de contraseña
- **Accesibilidad**: Navegación por teclado y estados de focus mejorados

#### 📦 **Corrección de Inventario Inicial**
- **Stock Inicial Preciso**: Corrección del cálculo de inventario al crear productos nuevos
- **Movimientos Correctos**: Registro preciso de movimientos de inventario inicial
- **Flujo Optimizado**: Creación de productos con stock 0 inicial y posterior ajuste
- **Consistencia de Datos**: Eliminación de duplicación de stock en productos nuevos
- **Historial Preciso**: Movimientos de inventario que reflejan correctamente los cambios

### ✨ **Funcionalidades Anteriores**

#### 👥 **Sistema Avanzado de Gestión de Usuarios**
- **Promoción Automática de Usuarios**: Conversión de usuarios regulares a administradores con creación automática de tienda
- **Modal de Promoción Inteligente**: Interfaz intuitiva con datos pre-llenados y validación automática
- **Creación y Seeding Automático**: Generación completa de tienda con datos iniciales y cambio de contexto automático
- **Gestión de Roles Mejorada**: Sistema refinado de permisos y accesos por rol
- **Edición de Usuarios**: Modal completo para modificar información de usuarios existentes

#### 🏪 **Módulo de Administración de Tiendas**
- **Dashboard Ejecutivo**: Tarjetas con estadísticas de todas las tiendas
- **Gestión Centralizada**: Tabla completa con información detallada
- **Filtros Avanzados**: Búsqueda por estado, nombre, administrador
- **Vista Detallada**: Modal con información completa de cada tienda
- **Control de Estados**: Activar/desactivar tiendas con confirmación

#### 🎯 **Sistema de Solicitud de Tiendas Mejorado**
- **Botón Flotante Inteligente**: Interfaz estilo WhatsApp con visibilidad basada en roles
- **Estilo Visual Mejorado**: Gradiente naranja distintivo y animaciones suaves
- **Control de Visibilidad**: Solo visible para usuarios con rol "user" que no han solicitado tienda
- **Integración con API**: Sincronización automática del estado de solicitud

#### 🔐 **Autenticación y Contexto Mejorados**
- **Login Inteligente**: Cambio automático de tienda al hacer login con usuario de diferente tienda
- **Validación de Contexto**: Verificación automática del `activeStoreId` vs `storeId` del usuario
- **Redirección Optimizada**: Navegación automática al contexto correcto según el rol del usuario
- **Sincronización de Estado**: Actualización automática del contexto de tienda tras login

#### 💰 **Sistema de Monedas Mejorado**
- **Botón de Cambio Intuitivo**: Icono de intercambio (ArrowLeftRight) que muestra la moneda opuesta
- **Símbolo Dinámico**: Muestra el símbolo de la moneda inactiva para indicar hacia dónde cambiar
- **Actualización Automática**: Todos los precios en carrito y pedidos se actualizan instantáneamente
- **Tooltip Informativo**: Información clara sobre el cambio de moneda disponible

#### 🖥️ **Modo Visor Mejorado**
- **Scroll Automático**: Navegación automática del catálogo
- **Control Manual**: Activación/desactivación con un clic
- **Indicadores Visuales**: Feedback claro del estado del modo visor
- **Optimización de Rendimiento**: Sin bucles infinitos ni memory leaks

#### 🔧 **Mejoras Técnicas Críticas**
- **Corrección de Tipos**: Solucionados todos los errores de TypeScript para compilación exitosa
- **Roles de Usuario**: Corregido tipo de rol de 'seller' a 'pos' para consistencia
- **Sistema de Toasts Mejorado**: Notificaciones elegantes sin romper el diseño
- **Navegación Optimizada**: Redirecciones inteligentes sin bucles
- **Manejo de Errores**: Sistema robusto de recuperación de errores

## 🛠️ **Stack Tecnológico**

### **Frontend**
- **Next.js 15.5.7**: Framework React con App Router
- **TypeScript 5.x**: Tipado estático para mayor robustez
- **Tailwind CSS 3.4**: Framework de estilos utilitarios
- **ShadCN/UI**: Componentes de interfaz modernos
- **Lucide React**: Iconografía consistente y moderna
- **Sonner**: Sistema de notificaciones toast

### **Backend y Base de Datos**
- **Supabase**: Base de datos PostgreSQL en la nube
- **Next.js API Routes**: Endpoints RESTful integrados
- **PostgreSQL**: Base de datos relacional con soporte completo
- **Row Level Security**: Seguridad a nivel de fila en Supabase

### **Herramientas de Desarrollo**
- **ESLint**: Linting de código
- **Prettier**: Formateo automático
- **Recharts**: Gráficos y visualizaciones
- **React Hook Form**: Gestión de formularios
- **Zod**: Validación de esquemas

## 📋 **Requisitos del Sistema**

### **Desarrollo Local**
- **Node.js**: 18.0 o superior
- **npm**: 9.0 o superior
- **Supabase**: Cuenta en supabase.com (base de datos PostgreSQL en la nube)
- **Memoria RAM**: Mínimo 4GB recomendado

### **Producción**
- **Vercel/Netlify**: Para despliegue frontend
- **Supabase**: Base de datos PostgreSQL en la nube
- **CDN**: Para assets estáticos (opcional)

## 🚀 **Instalación y Configuración**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/tienda-facil.git
cd tienda-facil
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Authentication
NEXTAUTH_SECRET=tu-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### **4. Configurar Supabase**

#### **Crear Proyecto en Supabase**
1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar URL y Service Role Key
4. Agregar a `.env.local`

#### **Ejecutar Migraciones**
En el SQL Editor de Supabase, ejecutar las migraciones en orden:

1. **Tablas principales** (si no existen):
   - `stores`
   - `users`
   - `products`
   - `sales`
   - `purchases`
   - `customers`
   - `suppliers`
   - etc.

2. **Módulo de Pagos** (nuevo):
```sql
-- Ejecutar: migrations/create_payments_tables.sql
```

Esto creará:
- Tabla `payments` (registros de gastos)
- Tabla `payment_recipients` (destinatarios)
- Índices y triggers necesarios

### **5. Ejecutar en Desarrollo**
```bash
npm run dev
```

### **6. Acceder a la Aplicación**
Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

## 🎯 **Características Destacadas v1.1.10.3**

### 🖼️ **Sistema Multi-Imágenes Avanzado**
La nueva funcionalidad de galería de imágenes revoluciona la presentación de productos:

1. **Gestión Visual**: Interfaz drag-and-drop para reordenar imágenes
2. **Vista Previa**: Carrusel interactivo con navegación por flechas y dots
3. **Optimización**: Compresión automática y lazy loading para mejor rendimiento
4. **Responsive**: Adaptación automática a diferentes tamaños de pantalla
5. **Accesibilidad**: Navegación por teclado y lectores de pantalla

### 🔐 **Mejora en Experiencia de Usuario**
El sistema de contraseñas ahora es más amigable y seguro:

- **Toggle Intuitivo**: Iconos Eye/EyeOff universalmente reconocidos
- **Doble Implementación**: Disponible en login y registro
- **Estado Persistente**: Mantiene la preferencia durante la sesión del modal
- **Accesibilidad**: Compatible con navegación por teclado y lectores de pantalla
- **Feedback Visual**: Hover effects y estados de focus mejorados

### 📦 **Inventario Más Preciso**
Corrección crítica en el manejo de stock inicial:

- **Flujo Corregido**: Creación de productos con stock 0 inicial
- **Movimientos Precisos**: Registro correcto del inventario inicial
- **Eliminación de Duplicación**: No más stock duplicado en productos nuevos
- **Consistencia**: Historial de movimientos que refleja la realidad
- **Confiabilidad**: Sistema más robusto para el control de inventario

## 🎯 **Características Destacadas Anteriores**

### 🚀 **Promoción Automática de Usuarios**
La nueva funcionalidad permite a los super usuarios convertir usuarios regulares en administradores de tienda de manera automática:

1. **Selección de Usuario**: Desde el panel de usuarios, seleccionar "Promover a Admin"
2. **Modal Inteligente**: Se abre un formulario con datos pre-llenados del usuario
3. **Creación Automática**: Se crea la tienda con seeding completo de datos iniciales
4. **Cambio de Contexto**: El sistema cambia automáticamente al contexto de la nueva tienda
5. **Notificación**: Confirmación visual del proceso completado

### 💱 **Sistema de Monedas Mejorado**
El botón de cambio de moneda ahora es más intuitivo y funcional:

- **Icono Intuitivo**: ArrowLeftRight en lugar del símbolo de dólar
- **Símbolo Opuesto**: Muestra hacia qué moneda se va a cambiar
- **Actualización Instantánea**: Todos los precios se actualizan automáticamente
- **Tooltip Informativo**: Información clara sobre la acción disponible

### 🔐 **Login Inteligente**
El sistema de autenticación ahora maneja automáticamente el cambio de contexto:

- **Detección Automática**: Identifica si el usuario pertenece a una tienda diferente
- **Cambio de Contexto**: Actualiza automáticamente el `activeStoreId`
- **Redirección Inteligente**: Navega al dashboard apropiado según el rol
- **Sincronización**: Mantiene consistencia entre contextos de auth y settings

## 🌐 **Despliegue en Producción**

### **Vercel (Recomendado)**
```bash
# Conectar con Vercel
vercel

# Configurar variables de entorno en Vercel Dashboard
# Desplegar
vercel --prod
```

### **Docker**
```bash
# Construir imagen
docker build -t tienda-facil .

# Ejecutar contenedor
docker run -p 3000:3000 tienda-facil
```

## 📚 **Documentación de API**

### **Endpoints Principales**

#### **Productos**
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products` - Actualizar producto
- `DELETE /api/products` - Eliminar producto

#### **Ventas**
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Registrar venta
- `PUT /api/sales` - Actualizar venta

#### **Administración**
- `GET /api/stores-admin` - Listar todas las tiendas
- `GET /api/stores-admin/stats` - Estadísticas globales
- `PUT /api/stores-admin/status` - Cambiar estado de tienda

#### **Pagos y Gastos** (Nuevo)
- `GET /api/payments?storeId={id}` - Listar pagos
- `POST /api/payments` - Registrar pago
- `PUT /api/payments` - Actualizar pago
- `DELETE /api/payments?id={id}` - Eliminar pago
- `GET /api/payment-recipients?storeId={id}` - Listar destinatarios
- `POST /api/payment-recipients` - Crear destinatario
- `PUT /api/payment-recipients` - Actualizar destinatario
- `DELETE /api/payment-recipients?id={id}` - Eliminar destinatario

## 👥 **Roles y Permisos**

| Rol | Catálogo | Productos | Inventario | POS | Compras | Pagos | Créditos | Entregas | Reportes | Ads | Dashboard | Admin | Promoción |
|-----|----------|-----------|------------|-----|---------|-------|----------|----------|----------|-----|-----------|-------|-----------|
| **Guest** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Depositary** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **POS** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **SuperUser** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔄 **Changelog - Versión 1.4.0**

### ✨ **Nuevas Características**
- **Sistema de Entregas**: Módulo completo de gestión de deliveries con zonas, proveedores y tarifas
- **Sistema de Créditos**: Gestión de cuentas por cobrar con pagos parciales y vencimientos
- **Módulo de Reportes**: Reportes avanzados de ventas, inventario, créditos y gastos
- **Sistema de Publicidades**: Gestión de campañas publicitarias con imágenes y programación
- **Módulo de Compras**: Registro de compras a proveedores con entrada de inventario
- **Gestión de Usuarios**: Panel avanzado de usuarios con edición y promoción

### 🛠️ **Mejoras Técnicas**
- **Sistema de Migraciones**: Herramienta para migrar datos de MongoDB a Supabase
- **Optimización de Base de Datos**: Índices mejorados y limpieza de datos
- **Auto-Sync en POS**: Sincronización automática de pedidos pendientes
- **Validaciones Mejoradas**: Verificación de estados y datos

### 📚 **Documentación**
- **README Actualizado**: Información completa de nuevos módulos
- **Configuración Supabase**: Instrucciones actualizadas de conexión
- **GUIDEs**: Documentación de migraciones y deployment

---

## 🔄 **Changelog - Versión 1.3.0**

### ✨ **Nuevas Características**
- **Módulo de Pagos**: Sistema completo para registrar gastos generales del negocio
- **Gestión de Destinatarios**: Base de datos de proveedores y destinatarios de pagos
- **6 Categorías de Gastos**: Alquiler, Combustible, Consumibles, Materia Prima, Servicios, Otros
- **5 Métodos de Pago**: Efectivo, Transferencia, Tarjeta, Cheque, Otro
- **Historial con Filtros**: Búsqueda y filtrado por categoría con totales automáticos
- **API Completa**: Endpoints RESTful para pagos y destinatarios
- **Integración Supabase**: Almacenamiento en PostgreSQL con tablas dedicadas

### 🐛 **Correcciones**
- **Zona de Peligro**: Funcionalidad de botones refinada (Reiniciar solo elimina datos, Producción solo cambia estado)
- **Verificación de PIN**: Manejo correcto cuando no hay PIN configurado
- **Conteo de Producción**: Dashboard muestra correctamente tiendas en modo producción
- **Estados de Tiendas**: Badges y listas muestran estado correcto (Activa/Inactiva/En Producción)

### 📚 **Documentación**
- **README Actualizado**: Información completa sobre módulo de Pagos
- **Configuración Supabase**: Instrucciones detalladas de conexión
- **Migraciones**: Documentación de tablas y estructura de base de datos

## 🔄 **Changelog - Versión 1.1.10.3**

### ✨ **Nuevas Características**
- **Sistema Multi-Imágenes**: Galería completa de imágenes para productos con gestión visual
- **Carrusel de Imágenes**: Vista previa interactiva con navegación fluida
- **Gestión de Galería**: Interfaz drag-and-drop para reordenar y eliminar imágenes
- **Toggle de Contraseña**: Funcionalidad mostrar/ocultar en modales de login y registro
- **Iconos Intuitivos**: Eye/EyeOff de Lucide React para mejor UX
- **Optimización de Imágenes**: Lazy loading y compresión automática

### 🐛 **Correcciones Críticas**
- **Stock Inicial Duplicado**: Corregido problema de inventario duplicado al crear productos
- **Flujo de Inventario**: Optimizado proceso de creación con stock inicial preciso
- **Movimientos de Inventario**: Registro correcto de previousStock y newStock
- **Consistencia de Datos**: Eliminación de discrepancias en historial de movimientos
- **Cálculo de Stock**: Corrección en la lógica de MovementService para productos nuevos

### ⚡ **Optimizaciones Técnicas**
- **Rendimiento de Imágenes**: Carga optimizada con lazy loading
- **Gestión de Estado**: Mejor manejo del estado de visibilidad de contraseña
- **Flujo de Creación**: Proceso optimizado para productos con inventario inicial
- **Validación de Datos**: Verificación mejorada de stock y movimientos
- **Experiencia de Usuario**: Interfaces más fluidas y responsivas

### 🎨 **Mejoras de Interfaz**
- **Galería Visual**: Diseño elegante para múltiples imágenes de productos
- **Navegación Intuitiva**: Controles claros para carrusel de imágenes
- **Botones de Contraseña**: Posicionamiento y estilo mejorados
- **Feedback Visual**: Indicadores claros de estado y acciones disponibles
- **Responsive Design**: Adaptación perfecta a todos los dispositivos

### 📋 **Changelog Anterior - Versión 1.10.23.1**

#### ✨ **Características Anteriores**
- **Sistema de Promoción de Usuarios**: Conversión automática de usuarios a administradores con creación de tienda
- **Modal de Promoción Inteligente**: Interfaz completa con validación y datos pre-llenados
- **Creación Automática de Tiendas**: Seeding completo con datos iniciales y cambio de contexto
- **Gestión Avanzada de Usuarios**: Edición completa de perfiles y roles de usuario
- **Login Inteligente**: Cambio automático de contexto de tienda según el usuario
- **Botón de Moneda Mejorado**: Icono de intercambio que muestra la moneda opuesta
- **Actualización Dinámica de Precios**: Cambio automático de símbolos en carrito y pedidos
- **Módulo de Administración de Tiendas**: Panel completo para super usuarios
- **Botón Flotante de Solicitud**: Sistema de registro integrado con estilo mejorado
- **Modo Visor Automático**: Scroll automático del catálogo

## 🤝 **Contribución**

### **Proceso de Contribución**
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

### **Estándares de Código**
- **ESLint**: Seguir las reglas configuradas
- **TypeScript**: Tipado estricto obligatorio
- **Commits**: Usar Conventional Commits
- **Testing**: Incluir tests para nuevas características

## 📄 **Licencia**

Este proyecto es propiedad de **Corporación 1 Plus, C.A.** y está protegido por derechos de autor. El uso, distribución o modificación requiere autorización expresa.

## 📞 **Soporte y Contacto**

### **Corporación 1 Plus, C.A.**
- **Email**: corporacion1plus@gmail.com
- **Teléfono**: +58 (412) 691-5593
- **Sitio Web**: www.corporacion1plus.com
- **Dirección**: Maracaibo, Venezuela

### **Soporte Técnico**
- **Documentación**: [docs.tiendafacil.com](https://docs.tiendafacil.com)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/tienda-facil/issues)
- **Discord**: [Comunidad TiendaFácil](https://discord.gg/tiendafacil)

---

<div align="center">

**🚀 TiendaFácil v1.4.0 - Impulsando el Comercio Digital**

*Desarrollado con ❤️ por Corporación 1 Plus, C.A.*

[![Corporación 1 Plus](https://img.shields.io/badge/Corporación%201%20Plus-Soluciones%20Empresariales-blue?style=for-the-badge)](https://corporacion1plus.com)

</div>