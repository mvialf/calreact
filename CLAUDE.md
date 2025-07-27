# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

**ESTADO ACTUAL:** Auditoría de código completada (Enero 2025). El proyecto ha sido optimizado siguiendo mejores prácticas de arquitectura, eliminando duplicación de código y centralizando configuraciones.

## Comandos de Desarrollo

### Desarrollo Principal
- `npm run dev` - Iniciar servidor de desarrollo con Turbopack en puerto 3002
- `npm run dev:webpack` - Iniciar servidor de desarrollo con Webpack en puerto 3001
- `npm run build` - Construir aplicación para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar ESLint
- `npm run typecheck` - Ejecutar verificación de tipos TypeScript

### Pruebas
- `npm test` - Ejecutar pruebas en modo observación
- `npm run test:ci` - Ejecutar pruebas en modo CI (sin observación)
- `npm run test:coverage` - Ejecutar pruebas con reporte de cobertura
- `npm run test:all` - Ejecutar todas las pruebas


## Arquitectura del Proyecto

### Descripción General
Cobralon-FB es una aplicación Next.js construida con Firebase para servicios backend. Es un sistema de gestión de proyectos para manejar clientes, proyectos, pagos, visitas y servicios postventa.

### Tecnologías Clave
- **Frontend**: Next.js 15, React 18, TypeScript
- **Framework UI**: Tailwind CSS con componentes Shadcn/ui
- **Backend**: Firebase (Firestore, Authentication)
- **Gestión de Estado**: Zustand
- **Formularios**: React Hook Form con validación Zod
- **Pruebas**: Jest, React Testing Library, Cypress
- **Mapas**: Integración Google Maps API

### Estructura Principal de la Aplicación

```
src/
├── app/                # Páginas Next.js App Router
│   ├── dashboard/      # Panel principal
│   ├── projects/       # Gestión de proyectos
│   ├── clients/        # Gestión de clientes
│   ├── payments/       # Procesamiento de pagos
│   ├── visits/         # Programación de visitas
│   ├── aftersales/     # Servicio postventa
│   └── settings/       # Configuración de aplicación
├── components/         # Componentes React reutilizables
│   ├── forms/          # Componentes de formularios
│   ├── modals/         # Diálogos modales
│   ├── ui/             # Componentes Shadcn/ui
│   └── calendar/       # Funcionalidad de calendario
├── services/           # Capa de servicios Firebase
├── hooks/              # Custom hooks de React
├── lib/                # Utilidades y configuraciones
└── types/              # Definiciones de tipos TypeScript
```

### Patrón de Capa de Servicios (Optimizado Post-Auditoría)
La aplicación implementa un patrón de capa de servicios con inyección de dependencias, optimizado durante la auditoría de 2025:

**Características:**
- Servicios Firebase aceptan instancia de Firestore como parámetro
- Utilidades Firestore centralizadas en `src/utils/firestore-helpers.ts`
- Configuración Firebase unificada y validada
- Eliminación completa de duplicación de código

**Beneficios:**
- Configuraciones dinámicas de base de datos por usuario
- Mejor capacidad de prueba mediante mocking
- Soporte para múltiples conexiones de base de datos
- Reutilización de lógica común de transformación de datos

Ejemplo:
```typescript
// Las funciones de servicio aceptan instancia de Firestore
export const getProjects = async (
  firestore: Firestore, 
  clientId?: string
): Promise<ProjectType[]> => {
  // Usa utilidades centralizadas para conversiones
  return convertFirestoreDocuments(docs, convertProjectDocument);
};
```

### Gestión de Estado
- **Estado Local**: Datos específicos de componentes usando hooks de React
- **Estado Global**: Datos compartidos usando stores de Zustand
- **Estado del Servidor**: Firebase Firestore con listeners en tiempo real
- **Estado de URL**: Parámetros de ruta y query strings

### Componentes UI
- Usa biblioteca de componentes Shadcn/ui construida sobre Radix UI
- Tailwind CSS para estilos con sistema de diseño personalizado
- Lucide React para iconos
- Componentes de formularios usan React Hook Form con validación Zod

### Configuración de Firebase
- Configuración basada en variables de entorno en `src/lib/firebase/config.ts`
- Valores por defecto para desarrollo
- Validación en tiempo de ejecución de valores de configuración requeridos

## Principios de Desarrollo (SOLID, DRY, KISS, YAGNI)

### Responsabilidad Única y Simplicidad
- Cada componente y función debe tener una sola responsabilidad
- Mantener la simplicidad en el diseño y la implementación
- Evitar la sobreingeniería

### No te Repitas (DRY)
- Priorizar la reutilización máxima de componentes, hooks y utilidades
- La duplicación de código está prohibida
- Antes de crear algo nuevo, verificar si ya existe

### Estructura de Archivos Obligatoria
Respetar y utilizar **exclusivamente** esta estructura:

**Lógica:**
- `src/utils/`: Funciones puras, helpers (format, validation)
- `src/lib/`: Lógica de negocio central (api, auth)
- `src/hooks/`: Custom Hooks de React
- `src/services/`: Integración con APIs de terceros

**Constantes (Post-Auditoría):**
- `src/constants/`: Centraliza todos los datos estáticos y configuraciones
- Archivos específicos: `project.ts`, `payment.ts`, `firebase.ts`, `defaults.ts`
- **PROHIBIDO**: No deben existir "valores mágicos" (strings, números) en los componentes
- **IMPLEMENTADO**: Sistema completo de constantes centralizadas durante auditoría 2025

### Implementación de Código TypeScript/React

**Retornos Anticipados:** Usar siempre para reducir anidamiento
**Nomenclatura:**
- Manejadores de eventos: Prefijo `handle` (ej. `handleClick`)
- Variables y funciones: Descriptivas y en `camelCase`

**Componentes:** Declarar como constantes con arrow functions y tipado explícito:
```typescript
type MiComponenteProps = {
  // props
};

export const MiComponente: React.FC<MiComponenteProps> = ({ /* props */ }) => {
  // ...código
};
```

**Clases Condicionales:** Usar `clsx` o `tailwind-merge` para gestionar clases dinámicas
**Accesibilidad:** Obligatoria con HTML semántico y atributos `aria-*`, `role` y `tabIndex`

### Estilos TailwindCSS
- **Fuente de Verdad:** Los estilos deben provenir únicamente de `tailwind.config.js`
- **PROHIBIDO:** Valores hardcodeados en `className` o atributo `style`

## Guías de Desarrollo

### Pruebas (Testing)
- **Filosofía:** Verificar comportamiento desde perspectiva del usuario
- **Herramientas:** Jest y React Testing Library
- Configuración Jest maneja transformaciones Lucide React
- Archivo de configuración: `jest.setup.js`
- Archivos mock en `src/__mocks__/` para Firebase y APIs externas
- Archivos de prueba usan extensión `.test.tsx`
- **Selección de Elementos:** Priorizar `getByRole`, `getByText` para accesibilidad

### Manejo de Errores
**Estrategia de Dos Niveles:**
1. **Errores Inesperados (UI):** Error Boundaries para errores de JavaScript
2. **Errores Esperados:** Try/catch en servicios y custom hooks, notificación con `useToast()`

### Configuración de Build
- Errores de TypeScript y ESLint ignorados durante builds (configurado en `next.config.ts`)
- Integración Google Maps API con variables de entorno

### Servicios Firebase (Arquitectura Optimizada)
**Post-Auditoría 2025:** Todas las operaciones Firebase siguen patrones unificados:

**Requisitos obligatorios:**
- Aceptar instancia Firestore como primer parámetro
- Usar utilidades centralizadas de `src/utils/firestore-helpers.ts`
- Implementar conversión de timestamps con `timestampToDate()`
- Usar funciones de conversión de documentos estandarizadas
- Incluir manejo adecuado de errores
- Usar tipos TypeScript para validación de datos
- Implementar reglas de seguridad apropiadas

**Utilidades disponibles:**
- `convertFirestoreDocuments()` - Conversión masiva de documentos
- `addTimestamps()` - Agregar timestamps automáticamente
- `updateTimestamps()` - Actualizar timestamps en modificaciones
- `timestampToDate()` - Conversión segura de Timestamp a Date

### Desarrollo de Componentes
- Seguir patrones existentes en `src/components/ui/`
- Usar utilidades Tailwind CSS siguiendo convenciones del proyecto
- Implementar características de accesibilidad apropiadas
- Incluir interfaces TypeScript para todas las props

### Manejo de Formularios
- Usar React Hook Form con esquemas Zod para validación
- Componentes de formularios en `src/components/forms/`
- Patrones consistentes de manejo de errores y retroalimentación al usuario

## Notas Importantes

### Estado Post-Auditoría (Enero 2025)
- **✅ COMPLETADO:** Eliminación de duplicación de código
- **✅ COMPLETADO:** Centralización de constantes y valores mágicos
- **✅ COMPLETADO:** Optimización de importaciones y dependencias
- **✅ COMPLETADO:** Implementación de utilidades Firestore reutilizables
- **✅ COMPLETADO:** Unificación de configuración Firebase
- **✅ COMPLETADO:** Resolución de TODOs pendientes críticos

### Configuración Técnica
- La configuración de Firebase debe establecerse vía variables de entorno
- Clave de API de Google Maps requerida para funcionalidad de direcciones  
- La aplicación soporta temas claro y oscuro
- Actualizaciones en tiempo real vía listeners de Firestore en toda la aplicación

### Estándares de Desarrollo
- **Comunicación:** Todo código, comentarios y documentación debe ser exclusivamente en español
- **Arquitectura:** Seguir patrones establecidos post-auditoría
- **Reutilización:** Priorizar utilidades existentes antes de crear nuevas
- **Constantes:** Usar sistema centralizado en `src/constants/`