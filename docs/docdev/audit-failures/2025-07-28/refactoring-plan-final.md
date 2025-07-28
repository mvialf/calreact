# Plan Final de Refactorización: Arquitectura Perfecta de Eventos

**Fecha**: 28 de Julio, 2025
**Estrategia**: Arquitectura específica por dominio
**Tiempo**: 6 horas
**Status**: ✅ Aprobado para implementación

## Visión Arquitectural Final

### 🎯 **Objetivo Confirmado**
- **❌** Sistema `events` general → **Deprecated/Eliminado**
- **✅** `projectEvents` como colección independiente y completa
- **✅** Base preparada para `afterSalesEvents`, `visitEvents` futuros
- **✅** Cada dominio maneja sus eventos específicamente

### 📊 **Estructura de Datos Confirmada**
```
Firestore Collections:
├── clients/ (name, phone, email)
├── projects/ (clientId → referencia a clients)
├── projectEvents/ (projectId, clientName sincronizado)
├── afterSalesEvents/ (futuro)
└── visitEvents/ (futuro)
```

## Fases de Implementación

### ✅ FASE 1: Limpieza y Preparación (30 min)
- [x] Limpiar colecciones `events` y `projectEvents`
- [x] Identificar proyectos existentes para pruebas
- [x] Backup de configuración actual

### 🔄 FASE 2: Sincronización de Datos (1h)
- [ ] Crear servicio `clientSyncService.ts`
- [ ] Sincronizar `clientName` en proyectos desde colección `clients`
- [ ] Validar integridad de datos proyecto-cliente

### 🏗️ FASE 3: Refactorización Core (2h)
- [ ] Mejorar `projectEventService.ts` con sincronización automática
- [ ] Eliminar dependencias de `EventType` general
- [ ] Actualizar `NewProjectEventModal` para trabajar solo con `ProjectEventType`

### 🎨 FASE 4: Componentes UI (1.5h)
- [ ] Refactorizar `event-modal.tsx` para eliminar código de calendar general
- [ ] Mejorar `NewProjectEventForm.tsx` con validaciones robustas
- [ ] Actualizar `ClientDisplay` con loading states

### 🧪 FASE 5: Testing y Validación (1h)
- [ ] Crear eventos de prueba
- [ ] Validar flujo completo de creación
- [ ] Tests unitarios para servicios críticos

### 📚 FASE 6: Documentación (30min)
- [ ] Actualizar CLAUDE.md con nueva arquitectura
- [ ] Guide para crear futuros `afterSalesEvents`
- [ ] Cleanup de documentación obsoleta

## Beneficios de Esta Arquitectura

### ✅ **Inmediatos**
- No más "Cliente no especificado"
- Datos de cliente siempre sincronizados
- UI limpia y consistente

### ✅ **A Futuro**
- Fácil extensión a `afterSalesEvents`
- Cada dominio completamente independiente
- Escalabilidad horizontal por dominio

### ✅ **Técnicos**  
- Código más limpio y mantenible
- Reducción de complejidad arquitectural
- Better separation of concerns

## Archivos a Modificar/Crear

### 🆕 **Nuevos Servicios**
- `src/services/clientSyncService.ts`
- `src/utils/eventValidation.ts`

### 🔄 **Refactorización**
- `src/services/projectEventService.ts` - Mejorar con sync
- `src/components/modals/calendar/NewProjectEventModal.tsx` - Simplificar
- `src/components/forms/NewProjectEventForm.tsx` - Mejorar validaciones
- `src/components/calendar/event-modal.tsx` - Limpiar código obsoleto

### 🗑️ **Eliminaciones**
- Dependencias de `EventType` en contexto de proyectos
- Referencias a sistema de eventos general
- Código de conversión entre sistemas

---

## 🚀 Comienza Implementación

**¿Estás listo para que comience la refactorización completa?**

Voy a empezar con la Fase 1 (limpieza) y continuar secuencialmente hasta tener la arquitectura perfecta funcionando.

**Confirmación**: ✅ Proceder con implementación completa de 6 horas