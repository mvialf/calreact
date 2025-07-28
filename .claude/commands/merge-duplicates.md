---
description: "Fusiona archivos duplicados automáticamente preservando la mejor funcionalidad"
allowed-tools: ["Glob", "Read", "Grep", "Write", "Edit", "MultiEdit", "Bash"]
---

# Merge Duplicates

Fusiona automáticamente archivos duplicados identificados por `/clean-code`, preservando la mejor funcionalidad de cada archivo.

## Objetivos
1. **Fusión inteligente**: Combina archivos similares manteniendo la mejor implementación
2. **Preservación de funcionalidad**: No pierde características importantes
3. **Actualización de referencias**: Modifica imports automáticamente
4. **Backup automático**: Crea respaldo antes de cambios destructivos
5. **Validación post-fusión**: Verifica que el código sigue funcionando

## Casos de Uso Específicos del Proyecto

### Constants Duplicados
- `src/constants/payment.ts` ← `src/constants/payments.ts`
- `src/constants/project.ts` ← archivos similares
- Consolidación de constantes Firebase

### Componentes Similares  
- `NewVisitDialog.tsx` + `visits/new/page.tsx` → Componente unificado
- Modales duplicados → Modal reutilizable
- Formularios similares → Form components base

### Servicios y Utilidades
- Servicios Firebase duplicados
- Helpers con funcionalidad solapada
- Tipos TypeScript redundantes

## Proceso de Fusión

### 1. Análisis Pre-Fusión
```bash
!echo "🔍 Analizando archivos duplicados..."
```

### 2. Backup Automático
```bash
!mkdir -p .backup/$(date +%Y%m%d_%H%M%S)
!cp -r src/ .backup/$(date +%Y%m%d_%H%M%S)/
```

### 3. Fusión Inteligente
- **Análisis de contenido**: Compara funcionalidades línea por línea
- **Detección del mejor**: Identifica implementación más robusta
- **Merge estratégico**: Combina características únicas
- **Cleanup automático**: Elimina redundancias

### 4. Actualización de Referencias
- **Import updates**: Modifica todas las importaciones
- **Type updates**: Actualiza referencias de tipos
- **Path corrections**: Corrige rutas relativas

### 5. Validación
```bash
!npm run typecheck
!npm run lint
```

## Criterios de Fusión

### Prioridad de Preservación
1. **Funcionalidad más completa** (más exports, más features)
2. **Mejor tipado TypeScript** (tipos más específicos)
3. **Mejor documentación** (JSDoc, comentarios útiles)
4. **Arquitectura más reciente** (patrones post-auditoría)
5. **Mejor testing** (más coverage, mejores tests)

### Patrones de Fusión
```typescript
// Ejemplo: Fusión de constants
// payment.ts (más completo) + payments.ts (duplicado)
// Resultado: payment.ts consolidado con todas las constantes
```

## Seguridad y Rollback

### Backup Strategy
- Backup completo antes de iniciar
- Commit automático pre-fusión
- Posibilidad de rollback completo

### Validación Continua
- TypeScript check en cada paso
- ESLint validation
- Test execution si disponible

## Uso
```bash
/merge-duplicates [--dry-run] [--backup-dir=custom] [--target-dir=src]
```

**Flags opcionales:**
- `--dry-run`: Solo muestra qué se fusionaría sin ejecutar
- `--backup-dir`: Directorio personalizado para backup
- `--target-dir`: Directorio a analizar (default: src)

Iniciando fusión inteligente de duplicados para $ARGUMENTS...

!echo "🚀 Merge Duplicates iniciado - Preservando funcionalidad, eliminando redundancia"