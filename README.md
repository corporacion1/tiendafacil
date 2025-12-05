# 🏪 TiendaFácil - Sistema Integral de Comercio Digital

<div align="center">

![TiendaFácil Logo](public/tienda_facil_logo.svg)

**Versión 1.2.0** | **Diciembre 2024**

*Sistema completo de Punto de Venta, Inventario y Comercio Electrónico*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

### 🏢 **Desarrollado por Corporación 1 Plus, C.A.**
*Soluciones tecnológicas empresariales de vanguardia*

</div>

## 🌟 **Descripción del Proyecto**

TiendaFácil es una plataforma integral de comercio digital desarrollada por **Corporación 1 Plus, C.A.**, diseñada para revolucionar la gestión comercial de pequeñas y medianas empresas. Combina un sistema de punto de venta moderno, gestión de inventario inteligente, y un catálogo público dinámico en una sola aplicación web de alto rendimiento.

### 🎯 **Misión**
Democratizar el acceso a tecnología comercial avanzada, permitiendo que cualquier negocio pueda competir en el mercado digital con herramientas profesionales y accesibles.

## ✨ **Características Principales**

### 🏪 **Sistema de Punto de Venta (POS)**
- **Interfaz Moderna**: Diseño intuitivo optimizado para velocidad de venta
- **Múltiples Métodos de Pago**: Efectivo, tarjetas, transferencias
- **Gestión de Clientes**: Base de datos integrada de clientes
- **Impresión de Tickets**: Tickets personalizables con logo y datos de la empresa
- **Sesiones de Caja**: Control completo de apertura/cierre de caja

### 📦 **Gestión de Inventario Inteligente**
- **Control de Stock en Tiempo Real**: Actualizaciones automáticas
- **Categorización Avanzada**: Familias, unidades, almacenes personalizables
- **Códigos de Barras**: Soporte completo para lectura y generación
- **Alertas de Stock**: Notificaciones automáticas de productos bajos
- **Movimientos Detallados**: Historial completo de entradas y salidas
- **Galería Multi-Imágenes**: Sistema completo de gestión de múltiples imágenes por producto
- **Stock Inicial Preciso**: Corrección automática de inventario al crear productos nuevos

### 🌐 **Catálogo Público Digital**
- **Vitrina Online**: Catálogo público accesible 24/7
- **Modo Visor Automático**: Scroll automático para displays
- **Pedidos por QR**: Generación automática de códigos QR para pedidos
- **Responsive Design**: Optimizado para todos los dispositivos
- **Publicidad Integrada**: Sistema de anuncios segmentados

### 📊 **Dashboard y Reportes**
- **Métricas en Tiempo Real**: Ventas, inventario, clientes
- **Gráficos Interactivos**: Visualización de datos con Recharts
- **Reportes Personalizables**: Exportación en múltiples formatos
- **Análisis de Tendencias**: Insights automáticos de ventas

### 🔐 **Seguridad y Control de Acceso**
- **Sistema de Roles**: 6 niveles de acceso (Guest, User, Depositary, POS, Admin, SuperUser)
- **Autenticación Robusta**: Sistema de login seguro con cambio automático de contexto
- **Visibilidad de Contraseña**: Toggle para mostrar/ocultar contraseña en login y registro
- **PIN de Seguridad**: Protección adicional para operaciones críticas
- **Auditoría Completa**: Logs de todas las operaciones
- **Validación de Contexto**: Verificación automática de permisos por tienda

### 🏢 **Administración Multi-Tienda**
- **Panel de Super Administrador**: Gestión centralizada de múltiples tiendas
- **Estadísticas Globales**: Métricas consolidadas de todas las tiendas
- **Control de Estados**: Activación/desactivación de tiendas
- **Modo Producción**: Transición automática de demo a producción
- **Promoción de Usuarios**: Conversión automática de usuarios a administradores
- **Creación Automática**: Seeding completo de nuevas tiendas

### 💰 **Sistema de Monedas Dual**
- **Moneda Principal y Secundaria**: Soporte completo para dos monedas
- **Cambio Dinámico**: Intercambio instantáneo entre monedas
- **Tasas de Cambio**: Actualización manual de tasas con validación temporal
- **Interfaz Intuitiva**: Botón de intercambio que muestra la moneda opuesta
- **Actualización Automática**: Todos los precios se actualizan al cambiar moneda

### 💳 **Módulo de Pagos y Gastos**
- **Registro de Gastos**: Sistema completo para registrar pagos generales del negocio
- **Categorías Predefinidas**: Alquiler, Combustible, Consumibles, Materia Prima, Servicios, Otros
- **Gestión de Destinatarios**: Base de datos de proveedores y destinatarios de pagos
- **Métodos de Pago**: Efectivo, Transferencia, Tarjeta, Cheque, Otro
- **Historial Completo**: Filtros por categoría, búsqueda y totales automáticos
- **Sin Impacto en Inventario**: Separado del módulo de compras de productos

## 🚀 **Nuevas Características - Versión 1.2.0**

### ✨ **Funcionalidades Recién Agregadas**

#### 💳 **Módulo de Pagos y Gastos Generales**
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
- **Next.js 15.5.5**: Framework React con App Router
- **TypeScript 5.0**: Tipado estático para mayor robustez
- **Tailwind CSS 3.4**: Framework de estilos utilitarios
- **ShadCN/UI**: Componentes de interfaz modernos
- **Lucide React**: Iconografía consistente y moderna

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
- **MongoDB**: 7.0 o superior (local o Atlas)
- **Memoria RAM**: Mínimo 4GB recomendado

### **Producción**
- **Vercel/Netlify**: Para despliegue frontend
- **MongoDB Atlas**: Base de datos en la nube
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

| Rol | Catálogo | Productos | Inventario | POS | Compras | Pagos | Créditos | Dashboard | Admin | Promoción |
|-----|----------|-----------|------------|-----|---------|-------|----------|-----------|-------|-----------|
| **Guest** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Depositary** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **POS** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **SuperUser** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔄 **Changelog - Versión 1.2.0**

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

**🚀 TiendaFácil v1.2.0 - Impulsando el Comercio Digital**

*Desarrollado con ❤️ por Corporación 1 Plus, C.A.*

[![Corporación 1 Plus](https://img.shields.io/badge/Corporación%201%20Plus-Soluciones%20Empresariales-blue?style=for-the-badge)](https://corporacion1plus.com)

</div>