# Design Document

## Overview

Este diseño implementa la funcionalidad de mostrar/ocultar contraseña en los modales de login y registro mediante la creación de un componente reutilizable `PasswordInput` que encapsula la lógica de toggle de visibilidad. El componente será integrado en ambos modales manteniendo la consistencia visual y funcional.

## Architecture

### Component Structure

```
PasswordInput (nuevo componente)
├── Input (campo de contraseña)
├── Button (toggle de visibilidad)
└── Icons (Eye/EyeOff)

LoginModal (modificado)
├── PasswordInput (reemplaza Input actual)
└── [resto de componentes existentes]

RegisterModal (modificado)
├── PasswordInput (reemplaza Input actual)
└── [resto de componentes existentes]
```

### State Management

- **Local State**: Cada instancia de `PasswordInput` mantendrá su propio estado de visibilidad
- **Reset Logic**: El estado se resetea cuando los modales se cierran
- **Isolation**: El estado de visibilidad es independiente entre login y registro

## Components and Interfaces

### PasswordInput Component

**Location**: `src/components/ui/password-input.tsx`

**Props Interface**:
```typescript
interface PasswordInputProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
```

**Features**:
- Estado interno `showPassword` (boolean)
- Función `togglePasswordVisibility`
- Contenedor relativo para posicionamiento del botón
- Input con tipo dinámico (`password` | `text`)
- Botón de toggle posicionado absolutamente
- Iconos Eye/EyeOff de Lucide React

### LoginModal Integration

**Modifications**:
- Importar `PasswordInput` component
- Reemplazar el `Input` de contraseña con `PasswordInput`
- Mantener todas las props existentes
- Preservar la funcionalidad de `onKeyDown` para Enter

### RegisterModal Integration

**Modifications**:
- Importar `PasswordInput` component
- Reemplazar el `Input` de contraseña con `PasswordInput`
- Mantener todas las props existentes
- Preservar la validación de contraseña existente

## Data Models

### State Structure

```typescript
// En PasswordInput component
interface PasswordInputState {
  showPassword: boolean; // false por defecto (contraseña oculta)
}

// Props que se pasan desde los modales
interface PasswordInputProps {
  value: string;        // valor de la contraseña
  onChange: Function;   // handler para cambios
  disabled?: boolean;   // estado de carga del formulario
  // ... otras props del Input original
}
```

## Error Handling

### Input Validation
- Mantener validación existente en ambos modales
- No interferir con la lógica de validación de formularios
- Preservar mensajes de error existentes

### Accessibility
- Mantener labels asociados correctamente
- Preservar navegación por teclado
- Asegurar que el botón de toggle sea accesible

### Edge Cases
- Manejar estado disabled correctamente
- Funcionar en dispositivos táctiles
- Mantener funcionalidad durante estados de carga

## Testing Strategy

### Unit Tests
- Verificar toggle de visibilidad funciona correctamente
- Confirmar que el tipo de input cambia entre `password` y `text`
- Validar que los iconos cambian apropiadamente
- Asegurar que las props se pasan correctamente

### Integration Tests
- Verificar integración con LoginModal
- Verificar integración con RegisterModal
- Confirmar que la funcionalidad no interfiere con validación
- Probar que el estado se resetea al cerrar modales

### Visual Tests
- Verificar posicionamiento correcto del botón
- Confirmar que el diseño es responsive
- Validar que los iconos son visibles y claros
- Asegurar consistencia visual entre modales

## Implementation Details

### Styling Approach
- Usar clases de Tailwind CSS consistentes con el diseño existente
- Posicionamiento absoluto para el botón dentro del contenedor relativo
- Mantener el mismo estilo de Input existente
- Aplicar hover effects para mejor UX

### Icon Selection
- `Eye` de Lucide React para mostrar contraseña (cuando está oculta)
- `EyeOff` de Lucide React para ocultar contraseña (cuando está visible)
- Tamaño consistente con otros iconos del proyecto (h-4 w-4)

### Responsive Design
- Asegurar que el botón sea fácilmente clickeable en móviles
- Mantener espaciado adecuado en diferentes tamaños de pantalla
- Preservar la funcionalidad táctil

### Performance Considerations
- Componente ligero sin dependencias adicionales
- Estado local para evitar re-renders innecesarios
- Uso eficiente de event handlers