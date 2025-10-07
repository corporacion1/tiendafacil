# Tienda Facil - Sistema de Punto de Venta e Inventario

Tienda Facil es una aplicación web moderna y completa, diseñada para ser un sistema de Punto de Venta (POS) e inventario todo en uno. Creada con Next.js y Tailwind CSS, ofrece una interfaz de usuario rápida, intuitiva y totalmente responsive, ideal para pequeñas y medianas empresas que buscan digitalizar y optimizar sus operaciones.

Esta versión actual funciona en un **modo de demostración offline**, donde todos los datos se gestionan localmente en el navegador y se reinician al recargar la página. Es perfecto para demostraciones a clientes sin necesidad de una base de datos.

## 🚀 Características Principales

- **Dashboard Interactivo:** Visualiza métricas clave de tu negocio en tiempo real, como ventas, compras y productos más vendidos.
- **Punto de Venta (POS) Moderno:** Una interfaz táctil y amigable para procesar ventas rápidamente, gestionar clientes y aplicar diferentes métodos de pago.
- **Gestión de Inventario Completa:** Crea, edita y elimina productos. Controla el stock, precios (detal y mayorista), costos y clasifícalos por familias y unidades.
- **Catálogo Público:** Una página de catálogo de cara al cliente que se puede compartir, permitiendo a los usuarios ver productos y generar pedidos mediante un código QR.
- **Módulo de Compras:** Registra las compras a proveedores para mantener el stock y los costos actualizados.
- **Gestión de Créditos:** Administra las ventas a crédito, registra abonos y lleva un control del saldo pendiente de cada cliente.
- **Reportes Detallados:** Genera reportes de ventas, compras, movimientos de inventario y más, con opciones para filtrar por fecha y exportar en diferentes formatos (CSV, JSON, TXT).
- **Publicidad Segmentada:** Módulo para crear y gestionar anuncios que se muestran en el catálogo, dirigidos a tipos de negocio específicos.
- **Alta Configuración:** Personaliza los datos de tu tienda, impuestos, monedas, redes sociales y clasificaciones de productos.
- **Seguridad con PIN:** Una capa de seguridad opcional para bloquear la aplicación y proteger el acceso.

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** ShadCN
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

## ☁️ Despliegue (Recomendado)

La forma más sencilla de desplegar esta aplicación Next.js es a través de **Vercel**, la plataforma de los creadores de Next.js.

1.  Sube este código a un repositorio de GitHub.
2.  Crea una cuenta en [Vercel](https://vercel.com) e importa el repositorio.
3.  Vercel detectará automáticamente la configuración y desplegará la aplicación con un solo clic.
