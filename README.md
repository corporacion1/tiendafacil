# 🏪 TiendaFácil - Sistema Integral de Comercio Digital

<div align="center">

![TiendaFácil Logo](public/tienda_facil_logo.svg)

**Versión 1.1.10.2** | **Octubre 2025**

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
- **Sistema de Roles**: 6 niveles de acceso (Guest, User, Depositary, Seller, Admin, SuperUser)
- **Autenticación Robusta**: Sistema de login seguro
- **PIN de Seguridad**: Protección adicional para operaciones críticas
- **Auditoría Completa**: Logs de todas las operaciones

### 🏢 **Administración Multi-Tienda**
- **Panel de Super Administrador**: Gestión centralizada de múltiples tiendas
- **Estadísticas Globales**: Métricas consolidadas de todas las tiendas
- **Control de Estados**: Activación/desactivación de tiendas
- **Modo Producción**: Transición automática de demo a producción

## 🚀 **Nuevas Características - Versión 1.1.10.2**

### ✨ **Funcionalidades Recién Agregadas**

#### 🏪 **Módulo de Administración de Tiendas**
- **Dashboard Ejecutivo**: Tarjetas con estadísticas de todas las tiendas
- **Gestión Centralizada**: Tabla completa con información detallada
- **Filtros Avanzados**: Búsqueda por estado, nombre, administrador
- **Vista Detallada**: Modal con información completa de cada tienda
- **Control de Estados**: Activar/desactivar tiendas con confirmación

#### 🎯 **Sistema de Solicitud de Tiendas**
- **Botón Flotante**: Interfaz estilo WhatsApp para solicitar tienda
- **Registro Obligatorio**: Proceso de autenticación integrado
- **Formulario Inteligente**: Validación completa de datos
- **Gestión de Solicitudes**: Panel para administrar peticiones

#### 🖥️ **Modo Visor Mejorado**
- **Scroll Automático**: Navegación automática del catálogo
- **Control Manual**: Activación/desactivación con un clic
- **Indicadores Visuales**: Feedback claro del estado del modo visor
- **Optimización de Rendimiento**: Sin bucles infinitos ni memory leaks

#### 🔧 **Mejoras Técnicas**
- **Corrección de Bucles Infinitos**: Optimización completa de contextos
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

| Rol | Catálogo | Productos | Inventario | POS | Compras | Créditos | Dashboard | Admin |
|-----|----------|-----------|------------|-----|---------|----------|-----------|-------|
| **Guest** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Depositary** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Seller** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **SuperUser** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔄 **Changelog - Versión 1.1.10.2**

### ✨ **Nuevas Características**
- **Módulo de Administración de Tiendas**: Panel completo para super usuarios
- **Botón Flotante de Solicitud**: Sistema de registro integrado
- **Modo Visor Automático**: Scroll automático del catálogo
- **Sistema de Toasts Mejorado**: Notificaciones elegantes

### 🐛 **Correcciones**
- **Errores de TypeScript**: Corregidos todos los errores de compilación para Vercel
- **Tipos de Ad**: Solucionado problema de compatibilidad en `imageUrl` opcional
- **Rutas API**: Agregados tipos correctos `NextRequest` en todas las rutas
- **Manejo de Errores**: Tipado correcto en bloques `catch` de APIs
- **Conexión MongoDB**: Verificación de conexión de base de datos
- **Build para Producción**: Aplicación lista para despliegue en Vercel

### ⚡ **Optimizaciones**
- **Compilación**: Build exitoso sin errores de TypeScript
- **Tipos de Datos**: Consistencia mejorada en tipos de formularios
- **Validación**: Esquemas Zod alineados con tipos TypeScript
- **Despliegue**: Preparado para producción en Vercel
- **Estabilidad**: Sistema más robusto y confiable

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
- **Email**: soporte@corporacion1plus.com
- **Teléfono**: +58 (212) 555-0123
- **Sitio Web**: www.corporacion1plus.com
- **Dirección**: Caracas, Venezuela

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