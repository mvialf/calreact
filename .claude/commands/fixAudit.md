# Fix Audit - Resolución Automatizada de Auditorías con Límites

Eres un especialista en resolución sistemática de problemas de auditoría de código que implementa correcciones paso a paso con control de versiones automático, validación continua y **sistema de límites para prevenir consumo excesivo de tokens**.

## Contexto y Objetivo

**Propósito**: Resolver sistemáticamente los problemas identificados en una auditoría (`/audit`) o archivo `task.md`, implementando cada corrección de manera incremental con validación automática y control de versiones.

**Flujo de Trabajo**:
1. Crear rama de trabajo específica para la auditoría
2. Resolver tareas una por una en orden de prioridad
3. Validar cada implementación automáticamente
4. Hacer commit por cada tarea completada exitosamente
5. Generar reporte de progreso continuo

## Sistema de Límites y Control de Recursos

### ⚙️ Configuración de Límites Automáticos

#### Límites de Tiempo por Sesión
- **Máximo sesión completa**: 2 horas
- **Warning a las**: 1h 30min
- **Pausa obligatoria**: Si se excede el límite

#### Límites por Tarea Individual
- **Tarea Simple** (imports, duplicados): 10 minutos máximo
- **Tarea Media** (refactoring, patrones): 15 minutos máximo  
- **Tarea Compleja** (inyección deps, multi-archivo): 20 minutos máximo
- **Tarea Crítica**: Generar informe, NO implementar automáticamente

#### Límites de Intentos y Recursos
- **Máximo intentos por tarea**: 3
- **Máximo rollbacks consecutivos**: 2
- **Máximo tareas fallidas antes de parar**: 5
- **Archivos máximos por tarea**: 8
- **Líneas de código máximas por change**: 500

#### Sistema de Monitoreo Automático
```bash
# Validador que se ejecuta cada 2 minutos
function validateLimits() {
    local elapsed=$(( $(date +%s) - task_start ))
    local limit_seconds=$(( task_limit_minutes * 60 ))
    
    if [ $elapsed -gt $(( limit_seconds * 8 / 10 )) ]; then
        echo "⚠️  WARNING: ${elapsed}s/${limit_seconds}s utilizados (80%)"
    fi
    
    if [ $elapsed -gt $limit_seconds ]; then
        echo "🚨 TIMEOUT: Generando informe de fallo y ejecutando rollback"
        generate_failure_report "TIMEOUT"
        execute_rollback
        return 1
    fi
}
```

### 📊 Clasificación Automática de Complejidad

Antes de iniciar cada tarea, el sistema evalúa automáticamente:

#### Tarea Simple (5-10 min, 2 intentos)
- Corrección de imports
- Eliminación de código duplicado básico
- Ajustes de configuración menores
- **Criterios**: 1-2 archivos, <50 líneas cambio

#### Tarea Media (10-15 min, 3 intentos)  
- Refactoring de componentes individuales
- Implementación de patrones establecidos
- Centralización de constantes
- **Criterios**: 2-4 archivos, 50-200 líneas cambio

#### Tarea Compleja (15-20 min, 3 intentos)
- Inyección de dependencias
- Restructuración arquitectónica menor
- Cambios multi-archivo coordinados
- **Criterios**: 4-8 archivos, 200-500 líneas cambio

#### Tarea Crítica (Solo análisis)
- Cambios de API breaking
- Migraciones de base de datos
- Refactoring completo de módulos
- **Criterios**: >8 archivos O >500 líneas O dependencias circulares

### 🚨 Sistema de Generación de Informes de Fallo

Cuando una tarea falla por timeout, máximo intentos o complejidad excesiva:

#### Ubicación de Informes
```
docs/docdev/audit-failures/
├── YYYY-MM-DD/
│   ├── session-HHhMM-summary.md
│   ├── task-XXX-failure-report.md
│   └── task-YYY-failure-report.md
```

#### Contenido del Informe Automático
- **Causa del fallo**: Timeout, máximo intentos, complejidad
- **Progreso realizado**: Pasos completados antes del fallo
- **Estado del rollback**: Confirmación de limpieza exitosa
- **Análisis de complejidad**: Factores que causaron el fallo
- **Recomendaciones**: División en subtareas, análisis manual
- **Métricas**: Tiempo utilizado, tokens estimados, archivos afectados

## Preparación Inicial

### 1. Análisis del Input
**Identifica la fuente de tareas:**
- Si hay un archivo `docs/task.md` generado por `/audit`
- Si se proporciona una lista específica de problemas
- Si se requiere ejecutar `/audit` primero para generar tareas

### 2. Setup de Git Workflow
```bash
# Crear rama específica para audit fixes
git checkout -b audit-fixes-$(date +%Y%m%d-%H%M)

# Verificar estado limpio
git status

# Crear backup branch por seguridad
git checkout -b audit-fixes-backup-$(date +%Y%m%d-%H%M)
git checkout audit-fixes-$(date +%Y%m%d-%H%M)
```

### 3. Validación de Entorno
```bash
# Verificar que el proyecto esté en estado funcional
npm run typecheck
npm run lint  
npm run test
npm run build
```

## Metodología de Resolución

### 1. Priorización de Tareas
**Orden de resolución:**
1. **Críticas**: Bugs, inconsistencias de datos, problemas de build
2. **Altas**: Violaciones arquitectónicas, patrones centrales
3. **Medias**: Mantenibilidad, developer experience
4. **Bajas**: Optimizaciones incrementales

### 2. Proceso por Tarea

#### Fase A: Preparación de Tarea CON VALIDACIÓN DE LÍMITES
```markdown
## 🎯 Iniciando Tarea: [TASK-ID] [Título]

### Clasificación Automática de Complejidad
```bash
# Análisis automático de complejidad ANTES de empezar
task_files=$(grep -c "Archivos:" task_description)
estimated_lines=$(estimate_lines_of_change)
dependencies=$(count_dependencies)

if [ $task_files -gt 8 ] || [ $estimated_lines -gt 500 ]; then
    echo "🚨 TAREA CRÍTICA detectada - Generando análisis en lugar de implementación"
    generate_analysis_report_instead
    exit 0
fi

# Asignar límites basados en complejidad
if [ $task_files -le 2 ] && [ $estimated_lines -le 50 ]; then
    COMPLEXITY="Simple"
    TIME_LIMIT=10
    MAX_ATTEMPTS=2
elif [ $task_files -le 4 ] && [ $estimated_lines -le 200 ]; then
    COMPLEXITY="Media"
    TIME_LIMIT=15
    MAX_ATTEMPTS=3
else
    COMPLEXITY="Compleja"
    TIME_LIMIT=20
    MAX_ATTEMPTS=3
fi
```

### Estado Inicial CON LÍMITES
- **Prioridad**: [Crítica/Alta/Media/Baja]
- **Complejidad automática**: $COMPLEXITY
- **Límite de tiempo**: $TIME_LIMIT minutos
- **Máximo intentos**: $MAX_ATTEMPTS
- **Archivos afectados**: [Lista] (máx: 8)
- **Estimación líneas**: [N] líneas (máx: 500)
- **Dependencias**: [Verificar completadas]

### Pre-validación CON TIMEOUT
```bash
# Asegurar estado limpio antes de empezar CON LÍMITE
timeout 300 npm run typecheck
timeout 300 npm run lint --fix  
timeout 300 npm run test

# Iniciar monitor de tiempo
TASK_START=$(date +%s)
echo "⏱️  Tarea iniciada: $(date). Límite: $TIME_LIMIT minutos"
```

#### Fase B: Implementación
```markdown
### Implementando Solución

#### Paso 1: [Descripción específica]
- Modificar: `archivo.ts:línea`
- Cambio: [Descripción del cambio]

#### Código Antes:
```typescript
// Código problemático actual
```

#### Código Después:
```typescript
// Código corregido implementado
```

#### Validación Intermedia CON MONITOREO:
```bash
# Monitor de tiempo cada validación
current_time=$(date +%s)
elapsed_minutes=$(( (current_time - TASK_START) / 60 ))
echo "⏱️  Tiempo transcurrido: ${elapsed_minutes}/${TIME_LIMIT} minutos"

if [ $elapsed_minutes -ge $(( TIME_LIMIT * 8 / 10 )) ]; then
    echo "⚠️  WARNING: 80% del tiempo límite utilizado"
fi

if [ $elapsed_minutes -ge $TIME_LIMIT ]; then
    echo "🚨 TIMEOUT: Generando informe de fallo"
    generate_failure_report "TIMEOUT" 
    execute_rollback
    exit 1
fi

# Verificar que el cambio no rompe nada CON TIMEOUT
timeout 300 npm run typecheck || { echo "Typecheck falló"; exit 1; }
timeout 300 npm run test -- --testPathPattern="relacionado" || { echo "Tests fallaron"; exit 1; }
```

#### Fase C: Validación Completa
```markdown
### Validando Implementación

#### Tests Automáticos:
```bash
# Suite completa de validación
npm run typecheck      # ✅ Sin errores TypeScript
npm run lint           # ✅ Sin warnings ESLint  
npm run test           # ✅ Todos los tests pasan
npm run build          # ✅ Build exitoso
```

#### Criterios de Aceptación:
- [ ] El problema original está resuelto
- [ ] No hay regresiones en funcionalidad existente
- [ ] Cumple con estándares de CLAUDE.md
- [ ] Tests relacionados pasan
- [ ] No introduce nuevos warnings/errors
```

#### Fase D: Commit y Documentación
```bash
# Commit estructurado para la tarea
git add .
git commit -m "$(cat <<'EOF'
fix(audit): [TASK-ID] [Título breve de la tarea]

- Problema: [Descripción breve del problema resuelto]
- Solución: [Approach tomado]
- Archivos: [Lista de archivos modificados]
- Validación: Todos los tests pasan

Ref: Audit task [TASK-ID]
Addresses: [Referencia a principio/estándar de CLAUDE.md]

🤖 Generated with Claude Code - Fix Audit
EOF
)"
```

### 3. Manejo de Errores y Rollback CON GENERACIÓN AUTOMÁTICA DE INFORMES

#### Si una Tarea Falla:
```markdown
## ❌ Tarea Fallida: [TASK-ID] - GENERANDO INFORME AUTOMÁTICO

### Problema Encontrado:
[Descripción específica del error]

### Causa del Fallo Detectada:
- [ ] TIMEOUT: Límite de tiempo excedido ($TIME_LIMIT minutos)
- [ ] MAX_ATTEMPTS: Máximo intentos agotados ($MAX_ATTEMPTS intentos)
- [ ] COMPLEXITY: Complejidad superior a la estimada
- [ ] VALIDATION_FAILED: Tests o typecheck fallan persistentemente
- [ ] DEPENDENCY_CONFLICT: Dependencias circulares o conflictos

### Rollback Automático CON VALIDACIÓN:
```bash
# Deshacer cambios de la tarea actual
echo "🔄 Ejecutando rollback automático..."
git reset --hard HEAD
git clean -fd

# Verificar que volvimos al estado funcional
echo "✅ Verificando integridad post-rollback..."
npm run typecheck && npm run lint && npm run test
if [ $? -eq 0 ]; then
    echo "✅ Rollback exitoso - Proyecto en estado limpio"
else
    echo "🚨 ERROR CRÍTICO: Rollback falló - Requiere intervención manual"
    exit 1
fi
```

### Generación Automática de Informe de Fallo:
```bash
# Generar informe detallado automáticamente
mkdir -p "docs/docdev/audit-failures/$(date +%Y-%m-%d)"
REPORT_FILE="docs/docdev/audit-failures/$(date +%Y-%m-%d)/task-${TASK_ID}-failure-report.md"

cat > "$REPORT_FILE" << EOF
# Informe de Tarea Fallida - Fix Audit

## Información General
- **Task ID**: $TASK_ID
- **Fecha/Hora**: $(date)
- **Duración intentada**: $elapsed_minutes de $TIME_LIMIT minutos
- **Número de intentos**: $current_attempt de $MAX_ATTEMPTS
- **Complejidad estimada**: $COMPLEXITY

## Causa del Fallo
$FAILURE_REASON

## Progreso Realizado
$PROGRESS_MADE

## Recomendaciones
- División en subtareas más granulares
- Revisión manual de complejidad
- Análisis de dependencias no detectadas

## Estado Final
✅ Rollback exitoso - Proyecto limpio
✅ Continuidad de sesión preservada
EOF

echo "📄 Informe generado: $REPORT_FILE"
```

### Estrategia de Recuperación AUTOMATIZADA:
1. **Generar informe detallado** con métricas y causa raíz
2. **Validar rollback** y estado limpio del proyecto  
3. **Analizar la causa** automáticamente (timeout/complejidad/dependencias)
4. **Sugerir división** en subtareas si es posible
5. **Actualizar métricas** de complejidad para futuras estimaciones
6. **Continuar con siguiente** tarea si quedan intentos en la sesión
```

## Reporting de Progreso

### Dashboard de Estado CON CONTROL DE LÍMITES
```markdown
## 📊 Progreso de Fix Audit CON MONITOREO DE RECURSOS

### Control de Sesión
- **Fecha inicio**: [timestamp]
- **Tiempo transcurrido**: [X]h [Y]min de 2h límite ([Z]% utilizado)
- **Rama de trabajo**: audit-fixes-[timestamp]
- **Estado de límites**: 🟢 Normal | 🟡 Warning | 🔴 Crítico

### Resumen General CON MÉTRICAS DE LÍMITES
- **Total tareas**: [N]
- **Completadas**: [N] ✅
- **En progreso**: [N] 🔄  
- **Fallidas por timeout**: [N] ⏰
- **Fallidas por complejidad**: [N] 🧩
- **Generadas como críticas**: [N] 🚨
- **Pendientes**: [N] ⏳

### Estado por Prioridad Y COMPLEJIDAD
- **Críticas**: [X/Y] completadas
- **Altas**: [X/Y] completadas  
- **Medias**: [X/Y] completadas
- **Bajas**: [X/Y] completadas

**Por Complejidad Automática:**
- **Simples**: [X] completadas, [Y] fallidas
- **Medias**: [X] completadas, [Y] fallidas  
- **Complejas**: [X] completadas, [Y] fallidas
- **Críticas**: [X] analizadas (no implementadas)

### Métricas de Eficiencia
- **Tiempo promedio por tarea**: [X] minutos
- **Tasa de éxito**: [X]% ([Y] exitosas de [Z] intentadas)
- **Rollbacks ejecutados**: [N]
- **Informes de fallo generados**: [N]

### Últimos Commits Y FALLOS
- `abc1234` ✅ fix(audit): TASK-001 Implementar inyección de dependencias (12 min)
- `def5678` ✅ fix(audit): TASK-002 Eliminar duplicación en ProjectForm (8 min)
- ❌ TASK-003 FALLIDA por timeout - Informe generado
- `ghi9012` ✅ fix(audit): TASK-004 Corregir configuración de build (15 min)

### Alertas de Límites Activas
🟡 **Warning**: 80% del tiempo de sesión utilizado
🔴 **Crítico**: Próxima tarea debe ser Simple o Media
🚨 **Emergencia**: 3 fallos consecutivos - Considerar pausar sesión
```

### Log Detallado
```markdown
## 📝 Log de Ejecución

### [Timestamp] - TASK-001 ✅ COMPLETADA
- **Duración**: 45 minutos
- **Archivos**: src/services/projectService.ts, src/hooks/useFirestore.ts
- **Tests**: 23 passed, 0 failed
- **Commit**: abc1234

### [Timestamp] - TASK-002 ✅ COMPLETADA  
- **Duración**: 30 minutos
- **Archivos**: src/components/forms/ProjectForm.tsx
- **Tests**: 23 passed, 0 failed
- **Commit**: def5678

### [Timestamp] - TASK-003 ❌ FALLIDA por TIMEOUT
- **Error**: Límite de tiempo excedido (20/15 minutos)
- **Complejidad**: Media → Compleja (reclasificada)
- **Progreso**: 60% completado antes del fallo
- **Rollback**: Ejecutado exitosamente
- **Informe**: docs/docdev/audit-failures/2024-01-15/task-003-failure-report.md
- **Recomendación**: Dividir en 2 subtareas más granulares
```

## Comandos Git Avanzados

### Gestión de Branch
```bash
# Ver todos los commits de la sesión de fixes
git log --oneline --grep="fix(audit)"

# Comparar con rama principal
git diff main...HEAD --stat

# Crear PR automáticamente (si gh CLI está disponible)
gh pr create --title "Fix Audit: Resolución de problemas de auditoría $(date +%Y-%m-%d)" \
  --body "$(cat <<'EOF'
## Resumen
Resolución automática de problemas identificados en auditoría de código.

## Tareas Completadas
- [x] TASK-001: Implementar inyección de dependencias
- [x] TASK-002: Eliminar duplicación en ProjectForm  
- [x] TASK-003: Corregir configuración de build

## Validación
- ✅ Todos los tests pasan
- ✅ Build exitoso
- ✅ No regresiones identificadas

## Métricas
- **Tiempo total**: [X] horas
- **Commits**: [N] commits
- **Archivos modificados**: [N] archivos

🤖 Generated with Claude Code - Fix Audit
EOF
)"
```

### Backup y Seguridad
```bash
# Crear tag de cada milestone importante
git tag -a "audit-fix-checkpoint-$(date +%H%M)" -m "Checkpoint: Tareas críticas completadas"

# Push de backup (opcional)
git push origin audit-fixes-$(date +%Y%m%d-%H%M) --tags
```

## Validaciones Específicas por Tipo de Fix

### Para Fixes de Servicios Firebase
```bash
# Validación específica de inyección de dependencias
npm run test -- --testNamePattern="service.*firestore"
npm run typecheck

# Verificar que no hay imports de db global
grep -r "from.*firebase.*client" src/services/ || echo "✅ No global imports found"
```

### Para Fixes de Componentes React
```bash
# Validación de componentes
npm run test -- --testNamePattern="component|form"
npm run lint -- --ext .tsx src/components/

# Verificar accesibilidad
npm run test -- --testNamePattern="a11y|accessibility"
```

### Para Fixes de Performance
```bash
# Análisis de bundle
npm run build && npm run analyze

# Tests de performance (si existen)
npm run test:performance
```

## Formato de Respuesta Final

```markdown
## 🎉 Fix Audit Completado

### Resumen de Ejecución
- **Duración total**: [X] horas [Y] minutos
- **Tareas completadas**: [N]/[Total] ([X]%)
- **Commits realizados**: [N] commits
- **Archivos modificados**: [N] archivos únicos

### Estado Final del Proyecto
```bash
npm run typecheck  # ✅ 0 errors
npm run lint       # ✅ 0 warnings  
npm run test       # ✅ All tests passing
npm run build      # ✅ Build successful
```

### Métricas de Mejora
- **Adherencia a CLAUDE.md**: [X]% → [Y]% (+[Z] puntos)
- **Duplicación de código**: [X]% → [Y]% (-[Z]%)
- **Test coverage**: [X]% → [Y]% (+[Z]%)
- **Build time**: [X]s → [Y]s ([Z]% mejora)

### Próximos Pasos Recomendados
1. **Review del PR**: Solicitar revisión de código del equipo
2. **Deploy a staging**: Validar en entorno de pruebas
3. **Monitoreo post-deploy**: Verificar métricas en producción
4. **Documentación**: Actualizar docs si aplica

### Rama de Trabajo
- **Branch**: `audit-fixes-[timestamp]`
- **Commits**: [N] commits con validación automática
- **Estado**: Listo para merge hacia `main`
```

## Uso del Comando

Para usar este comando:

1. **Ejecutar**: `/fixAudit`
2. **Proporcionar**: Archivo task.md o lista de problemas
3. **Confirmar**: Estrategia de branch y validación
4. **Monitorear**: Progreso automático paso a paso

El comando manejará automáticamente todo el flujo de Git, validación y reporting, permitiendo una resolución sistemática y segura de problemas de auditoría.