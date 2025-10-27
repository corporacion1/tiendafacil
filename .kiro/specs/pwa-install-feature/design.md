# Design Document

## Overview

Este diseño implementa funcionalidad PWA completa que permite a usuarios logueados instalar la aplicación como acceso directo en sus dispositivos. La solución incluye configuración de manifest, service worker, y un componente de instalación integrado en la UI existente.

## Architecture

### PWA Components Structure

```
PWA Implementation
├── public/manifest.json (Web App Manifest)
├── public/sw.js (Service Worker)
├── public/icons/ (App Icons)
├── components/pwa-install-button.tsx (Install Component)
└── hooks/use-pwa-install.tsx (PWA Logic Hook)

Integration Points
├── Layout (register service worker)
├── Catalog Page (install button for logged users)
└── Products Page (install button for logged users)
```

### State Management

- **PWA Install State**: Hook personalizado para manejar el estado de instalación
- **User Authentication**: Integración con contexto de autenticación existente
- **Browser Support**: Detección de soporte PWA del navegador
- **Installation Status**: Tracking si la PWA ya está instalada

## Components and Interfaces

### PWAInstallButton Component

**Location**: `src/components/pwa-install-button.tsx`

**Props Interface**:
```typescript
interface PWAInstallButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}
```

**Features**:
- Detección automática de soporte PWA
- Manejo del evento `beforeinstallprompt`
- Estados: disponible, instalando, instalado, no soportado
- Integración con sistema de toast para feedback
- Responsive design para móvil y escritorio

### usePWAInstall Hook

**Location**: `src/hooks/use-pwa-install.tsx`

**Interface**:
```typescript
interface PWAInstallHook {
  canInstall: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installPWA: () => Promise<void>;
  isSupported: boolean;
}
```

**Functionality**:
- Detectar soporte del navegador para PWA
- Capturar y manejar `beforeinstallprompt` event
- Ejecutar instalación y manejar resultado
- Detectar si la PWA ya está instalada
- Cleanup de event listeners

## Data Models

### Web App Manifest Structure

```json
{
  "name": "Catálogo de Productos",
  "short_name": "Catálogo",
  "description": "Aplicación de catálogo de productos y pedidos",
  "start_url": "/catalog",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### Service Worker Configuration

```javascript
// Basic caching strategy
const CACHE_NAME = 'catalog-app-v1';
const urlsToCache = [
  '/',
  '/catalog',
  '/products',
  '/static/js/bundle.js',
  '/static/css/main.css'
];
```

## Error Handling

### Browser Compatibility
- Detectar soporte PWA antes de mostrar botón
- Fallback graceful para navegadores no compatibles
- Mensajes informativos sobre requisitos

### Installation Errors
- Manejar errores de instalación con toast messages
- Logging de errores para debugging
- Retry mechanism para fallos temporales

### Network Handling
- Service worker para caching básico
- Funcionalidad offline limitada
- Estrategia cache-first para recursos estáticos

## Testing Strategy

### Unit Tests
- Verificar detección de soporte PWA
- Probar estados del hook usePWAInstall
- Validar comportamiento del componente InstallButton
- Confirmar manejo correcto de eventos

### Integration Tests
- Verificar integración con autenticación
- Probar instalación end-to-end en navegadores compatibles
- Validar que el botón aparece solo para usuarios logueados
- Confirmar funcionamiento en diferentes dispositivos

### PWA Validation
- Usar Lighthouse para validar configuración PWA
- Verificar manifest.json con herramientas de desarrollo
- Probar instalación en múltiples navegadores
- Validar iconos y metadatos

## Implementation Details

### Icon Requirements
- **192x192px**: Icono estándar para instalación
- **512x512px**: Icono de alta resolución
- **Formato**: PNG con transparencia
- **Maskable**: Soporte para iconos adaptativos en Android

### Service Worker Strategy
- **Caching**: Cache-first para recursos estáticos
- **Updates**: Automatic update on new version
- **Scope**: Toda la aplicación (/)
- **Offline**: Página offline básica para rutas principales

### Browser Support
- **Chrome/Edge**: Soporte completo
- **Firefox**: Soporte limitado (desktop)
- **Safari**: Soporte en iOS/macOS
- **Fallback**: Mensaje informativo para navegadores no compatibles

### Integration Points
- **Catalog Page**: Botón en header junto a otros controles de usuario
- **Products Page**: Botón en toolbar de administración
- **Layout**: Registro de service worker en componente raíz
- **Authentication**: Mostrar solo cuando `authUser` existe

### Performance Considerations
- Lazy loading del service worker
- Minimal bundle size impact
- Efficient event listener management
- Optimized icon loading