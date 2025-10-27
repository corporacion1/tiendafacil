# Requirements Document

## Introduction

Esta especificación define los requisitos para agregar funcionalidad de mostrar/ocultar contraseña en los modales de login y registro del catálogo. La funcionalidad permitirá a los usuarios alternar la visibilidad de su contraseña mientras la escriben, mejorando la experiencia de usuario y reduciendo errores de entrada.

## Glossary

- **LoginModal**: Componente modal que permite a los usuarios iniciar sesión en la aplicación
- **RegisterModal**: Componente modal que permite a los usuarios crear una nueva cuenta
- **Password Field**: Campo de entrada de contraseña en los formularios de login y registro
- **Toggle Button**: Botón que permite alternar entre mostrar y ocultar la contraseña
- **Eye Icon**: Icono que representa la acción de mostrar la contraseña (contraseña oculta)
- **EyeOff Icon**: Icono que representa la acción de ocultar la contraseña (contraseña visible)
- **Password Input Container**: Contenedor que incluye el campo de contraseña y el botón de toggle

## Requirements

### Requirement 1

**User Story:** Como usuario que intenta iniciar sesión, quiero poder ver mi contraseña mientras la escribo, para verificar que la estoy ingresando correctamente.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el botón de mostrar contraseña, THE LoginModal SHALL cambiar el tipo de input de "password" a "text"
2. WHEN el usuario hace clic en el botón de ocultar contraseña, THE LoginModal SHALL cambiar el tipo de input de "text" a "password"
3. THE LoginModal SHALL mostrar un icono de ojo (Eye) cuando la contraseña está oculta
4. THE LoginModal SHALL mostrar un icono de ojo tachado (EyeOff) cuando la contraseña está visible
5. THE LoginModal SHALL mantener el estado de visibilidad durante la sesión del modal

### Requirement 2

**User Story:** Como usuario que se registra, quiero poder ver mi contraseña mientras la escribo, para asegurarme de que cumpla con los requisitos y esté correcta.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el botón de mostrar contraseña, THE RegisterModal SHALL cambiar el tipo de input de "password" a "text"
2. WHEN el usuario hace clic en el botón de ocultar contraseña, THE RegisterModal SHALL cambiar el tipo de input de "text" a "password"
3. THE RegisterModal SHALL mostrar un icono de ojo (Eye) cuando la contraseña está oculta
4. THE RegisterModal SHALL mostrar un icono de ojo tachado (EyeOff) cuando la contraseña está visible
5. THE RegisterModal SHALL mantener el estado de visibilidad durante la sesión del modal

### Requirement 3

**User Story:** Como usuario, quiero que el botón de mostrar/ocultar contraseña sea fácilmente accesible y visualmente claro, para poder usarlo sin confusión.

#### Acceptance Criteria

1. THE Password Input Container SHALL posicionar el botón de toggle dentro del campo de contraseña en el lado derecho
2. THE Password Input Container SHALL usar iconos reconocibles (Eye y EyeOff de Lucide React)
3. THE Password Input Container SHALL mantener el botón accesible en dispositivos móviles y de escritorio
4. THE Password Input Container SHALL proporcionar feedback visual al hacer hover sobre el botón
5. THE Password Input Container SHALL mantener la funcionalidad del botón incluso cuando el formulario está en estado de envío

### Requirement 4

**User Story:** Como usuario, quiero que la funcionalidad de mostrar/ocultar contraseña no interfiera con otras funciones del formulario, para mantener una experiencia fluida.

#### Acceptance Criteria

1. THE LoginModal SHALL preservar la funcionalidad de envío del formulario con Enter
2. THE LoginModal SHALL mantener la validación existente del campo de contraseña
3. THE LoginModal SHALL resetear el estado de visibilidad cuando se cierra el modal
4. THE LoginModal SHALL mantener el foco en el campo de contraseña después de usar el toggle
5. THE LoginModal SHALL funcionar correctamente con el estado de carga del formulario

### Requirement 5

**User Story:** Como usuario, quiero que la funcionalidad de mostrar/ocultar contraseña en el registro no interfiera con la validación de contraseña, para asegurar una experiencia consistente.

#### Acceptance Criteria

1. THE RegisterModal SHALL preservar la funcionalidad de envío del formulario
2. THE RegisterModal SHALL mantener la validación existente del campo de contraseña (mínimo 6 caracteres)
3. THE RegisterModal SHALL resetear el estado de visibilidad cuando se cierra el modal
4. THE RegisterModal SHALL mantener el foco en el campo de contraseña después de usar el toggle
5. THE RegisterModal SHALL funcionar correctamente con el estado de carga del formulario