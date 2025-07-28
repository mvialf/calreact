# Diagnóstico: Error "Cliente no especificado" en Project Events

**Fecha**: 28 de Julio, 2025
**Categoría**: Falla Crítica de Integración
**Status**: En Investigación
**Prioridad**: Alta

## Resumen Ejecutivo

Se identificó un problema crítico en la funcionalidad de eventos de proyecto donde aparece el mensaje "cliente no especificado" al intentar guardar eventos. La investigación revela una **desconexión arquitectural** entre dos sistemas de eventos independientes que están intentando interactuar incorrectamente.

## Diagnóstico Técnico Detallado

### 1. Identificación del Problema Principal

**Síntoma Reportado**: Error "cliente no especificado" al guardar eventos de proyecto
**Problema Real**: Conflicto entre dos sistemas de eventos con diferentes propósitos y estructuras de datos

### 2. Análisis de Arquitectura - Dos Sistemas Independientes

#### Sistema A: Calendar Events (`EventType`)
- **Ubicación**: `src/types/event.ts`
- **Propósito**: Eventos generales del calendario
- **Campos clave**: `referenceId`, `type`, `clientName?` (opcional)
- **Servicio**: Sistema de referencias (`eventReferenceService.ts`)

#### Sistema B: Project Events (`ProjectEventType`) 
- **Ubicación**: `src/types/project.ts` (líneas 95-119)
- **Propósito**: Eventos específicos de proyecto (colección independiente)
- **Campos clave**: `projectId`, `clientName?` (opcional), `checklist`, etc.
- **Servicio**: `projectEventService.ts`

### 3. Punto de Conflicto Identificado

**Archivo**: `src/components/calendar/event-modal.tsx` (líneas 273-290)

```typescript
// Cuando tipo === 'Proyecto', se intenta usar NewProjectEventModal
// Pero luego se espera convertir ProjectEventType a EventType
if (type === 'Proyecto' && showProjectModal) {
    return (
        <NewProjectEventModal
            // ...
            onSubmit={handleProjectSave} // <- PROBLEMA AQUÍ
        />
    );
}
```

**Problema**: `handleProjectSave` intenta mapear datos de `ProjectEventType` a `EventType`, causando pérdida de información y referencias incorrectas.

### 4. Origen del Mensaje "Cliente no especificado"

**Ubicación**: `src/components/modals/calendar/NewProjectEventModal.tsx:58`

```typescript
label: `${project.projectNumber} - ${project.clientName || 'Cliente no especificado'}`
```

**Análisis**: 
- NO es un error de guardado
- Es un texto de fallback que se muestra cuando `project.clientName` es null/undefined
- Indica que los proyectos no tienen `clientName` poblado correctamente

### 5. Inconsistencias de Datos Identificadas

1. **ProjectType.clientName** es opcional pero se espera que esté poblado
2. **ProjectType.clientId** existe pero no se usa para obtener el nombre del cliente
3. Los proyectos pueden tener `clientId` pero no `clientName` sincronizado

## Implicaciones Técnicas

### Problemas Actuales:
1. **Pérdida de datos**: Conversión forzada entre tipos incompatibles
2. **Referencias rotas**: `projectId` vs `referenceId` confusion
3. **UX degradada**: Usuarios ven "Cliente no especificado" 
4. **Arquitectura inconsistente**: Dos sistemas fazilitando la misma funcionalidad

### Riesgos Identificados:
- **Data Loss**: Información de eventos puede perderse en la conversión
- **Referential Integrity**: Referencias entre proyecto y eventos pueden romperse
- **User Confusion**: UI confusa al mostrar datos incompletos
- **Future Bugs**: La inconsistencia arquitectural generará más problemas

## Análisis de Causa Raíz

### Causa Primaria
**Arquitectura Fragmentada**: Se crearon dos sistemas para manejar eventos sin una estrategia unificada:
- Calendar Events para vista de calendario
- Project Events para gestión específica de proyectos

### Causas Secundarias
1. **Missing Data Sync**: `clientName` no se sincroniza con `clientId`
2. **Component Misuse**: `NewProjectEventModal` se usa desde contexto de calendar
3. **Service Confusion**: Servicios con propósitos similares pero incompatibles

## Estado de Datos en Firestore

### Colecciones Afectadas:
- `projects` - Puede tener `clientId` sin `clientName` 
- `projectEvents` - Nueva colección independiente (post-auditoría 2025)
- `events` - Eventos del calendario general (asumida)

### Integridad de Datos:
- **CRÍTICO**: Projects pueden tener referencias de cliente incompletas
- **RIESGO**: Eventos de proyecto pueden crearse sin información de cliente

## Conclusiones

1. **El problema NO es un bug**, es un **conflicto arquitectural**
2. **Se necesita unificación** de los sistemas de eventos o **separación completa**
3. **Datos de cliente** requieren **sincronización proactiva**
4. **UX debe mejorar** mostrando información correcta del cliente

## Próximos Pasos Recomendados

Ver: `plan-de-solucion-project-events.md` (archivo de plan detallado)

---

**Investigado por**: Claude Code Assistant
**Review Status**: Pendiente
**Técnico Asignado**: N/A