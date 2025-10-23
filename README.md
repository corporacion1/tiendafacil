# 🏪 TiendaFácil - Sistema Integral de Comercio Digital

<div align="center">

![TiendaFácil Logo](public/tienda_facil_logo.svg)

**Versión 1.10.23.1** | **Octubre 2025**

*Sistema completo de Punto de Venta, Inventario y Comercio Electrónico*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
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

## 🚀 **Nuevas Características - Versión 1.10.23.1**

### ✨ **Funcionalidades Recién Agregadas**

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

### **Backend**
- **MongoDB 7.0**: Base de datos NoSQL escalable
- **Next.js API Routes**: Endpoints RESTful integrados
- **Mongoose**: ODM para MongoDB con validaciones

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
MONGODB_URI=mongodb://localhost:27017/tienda-facil
NEXTAUTH_SECRET=tu-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### **4. Ejecutar en Desarrollo**
```bash
npm run dev
```

### **5. Acceder a la Aplicación**
Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

## 🎯 **Características Destacadas v1.10.23.1**

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

## 👥 **Roles y Permisos**

| Rol | Catálogo | Productos | Inventario | POS | Compras | Créditos | Dashboard | Admin | Promoción |
|-----|----------|-----------|------------|-----|---------|----------|-----------|-------|-----------|
| **Guest** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Depositary** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **POS** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **SuperUser** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔄 **Changelog - Versión 1.10.23.1**

### ✨ **Nuevas Características**
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

### 🐛 **Correcciones Críticas**
- **Errores de Compilación**: Corregidos todos los errores de TypeScript para build exitoso
- **Tipos de Usuario**: Solucionado rol 'seller' → 'pos' para consistencia de tipos
- **Contexto de Autenticación**: Mejorado flujo de login y cambio de tienda automático
- **Símbolos de Moneda**: Corregidos precios hardcodeados en carrito y pedidos
- **Validación de Contexto**: Verificación automática de tienda activa vs usuario
- **API de Login**: Incluido campo `storeRequest` en respuesta para sincronización
- **Visibilidad de Botones**: Control basado en roles y estado de solicitud

### ⚡ **Optimizaciones Técnicas**
- **Compilación Exitosa**: Build completo sin errores de TypeScript
- **Flujo de Autenticación**: Login optimizado con cambio automático de contexto
- **Gestión de Estado**: Sincronización mejorada entre contextos de auth y settings
- **UX de Monedas**: Interfaz más intuitiva para cambio de moneda activa
- **Rendimiento**: Eliminación de bucles infinitos y memory leaks
- **Estabilidad**: Sistema más robusto y confiable para producción

### 🎨 **Mejoras de Interfaz**
- **Botón de Solicitud**: Gradiente naranja distintivo y mejor visibilidad
- **Icono de Moneda**: ArrowLeftRight más intuitivo que DollarSign
- **Tooltip Informativo**: Información clara sobre cambio de moneda disponible
- **Modal de Promoción**: Diseño elegante con validación en tiempo real
- **Feedback Visual**: Indicadores claros de estado y acciones disponibles

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

**🚀 TiendaFácil v1.1.10.2 - Impulsando el Comercio Digital**

*Desarrollado con ❤️ por Corporación 1 Plus, C.A.*

[![Corporación 1 Plus](https://img.shields.io/badge/Corporación%201%20Plus-Soluciones%20Empresariales-blue?style=for-the-badge)](https://corporacion1plus.com)

</div>