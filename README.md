# Tienda Facil - Sistema de Punto de Venta e Inventario (Ver. 1.0.0.1)

Tienda Facil es una aplicación web moderna y completa, diseñada para ser un sistema de Punto de Venta (POS) e inventario todo en uno. Creada con Next.js y Tailwind CSS, y ahora conectada a **Firebase**, ofrece una interfaz de usuario rápida, intuitiva y con persistencia de datos en tiempo real.

Esta versión está conectada a una base de datos **Firestore**, lo que permite que tus datos (productos, ventas, inventario, etc.) se guarden de forma segura en la nube.

## 🚀 Características Principales

- **Dashboard Interactivo:** Visualiza métricas clave de tu negocio en tiempo real.
- **Punto de Venta (POS) Moderno:** Procesa ventas rápidamente, gestiona clientes y aplica múltiples métodos de pago.
- **Gestión de Inventario Completa:** Crea, edita y elimina productos con persistencia en la nube.
- **Catálogo Público Dinámico:** Una página de catálogo que se actualiza en tiempo real, con generación de pedidos mediante código QR.
- **Módulo de Compras y Créditos:** Registra compras a proveedores y administra las ventas a crédito con abonos.
- **Reportes Detallados:** Genera reportes de ventas, compras, movimientos de inventario y más.
- **Publicidad Segmentada:** Módulo para crear y gestionar anuncios dirigidos a tipos de negocio específicos.
- **Alta Configuración y Seguridad:** Personaliza tu tienda, monedas, impuestos y protege el acceso con un PIN de seguridad.

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js 15 (App Router)
- **Base de Datos:** Firebase Firestore
- **Autenticación:** Firebase Authentication (simulada)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS & ShadCN
- **Iconos:** Lucide React
- **Gráficos:** Recharts

## 🏁 Cómo Empezar (Desarrollo Local)

Para ejecutar este proyecto en tu máquina local, sigue estos pasos:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

3.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## ☁️ Despliegue en Vercel (Recomendado)

La forma más sencilla de desplegar esta aplicación Next.js es a través de **Vercel**, la plataforma de los creadores de Next.js. Si tu proyecto de Vercel ya está conectado a tu repositorio de GitHub, el despliegue es automático.

1.  **Sube tus cambios a GitHub:**
    ```bash
    git add .
    git commit -m "Deploy version 1.0.0.1"
    git push
    ```

2.  **Vercel se encargará del resto:** Al detectar el `push` a tu rama principal, Vercel iniciará un nuevo despliegue automáticamente. En pocos minutos, tu aplicación estará actualizada con la última versión.
