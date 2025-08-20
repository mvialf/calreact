---
allowed-tools: Read, Glob, Grep, LS, Edit, MultiEdit, mcp__filesystem__*, mcp__serena__*, mcp__context7__*, mcp__shadcn-ui__*, mcp__firebase__*, mcp__task-master-ai__*, mcp__sequential-thinking__*, mcp__memory__*
argument-hint: all | metrics-only | stack-only | validate-only | context-only
description: Actualización automática de documentación del proyecto usando MCPs
---

# Actualización Automática de Documentación

Actualiza la documentación del proyecto basándose en el estado actual del código usando MCPs especializados.

## Uso:
- `/actualizar_doc` o `/actualizar_doc all` - Actualización completa
- `/actualizar_doc metrics-only` - Solo actualizar métricas
- `/actualizar_doc stack-only` - Solo actualizar stack tecnológico  
- `/actualizar_doc validate-only` - Solo validar componentes
- `/actualizar_doc context-only` - Solo actualizar archivos de contexto Claude Code

## Procesamiento de Argumentos

Argumentos recibidos: "$ARGUMENTS"

### Determinando Modo de Operación:

Si argumentos están vacíos o contienen "all" → **MODO COMPLETO**
Si argumentos contienen "metrics-only" → **MODO MÉTRICAS**  
Si argumentos contienen "stack-only" → **MODO STACK**
Si argumentos contienen "validate-only" → **MODO VALIDACIÓN**
Si argumentos contienen "context-only" → **MODO CONTEXTO**

---

## MODO COMPLETO (all o sin argumentos)

Ejecutar actualización completa de documentación:

### Fase 1: Análisis Inicial
Usar Sequential-Thinking MCP para planificar la actualización:
- Analizar qué documentos necesitan actualización
- Identificar discrepancias potenciales
- Planificar orden de operaciones

### Fase 2: Recolección de Métricas
1. **Componentes**: Usar Filesystem MCP para contar archivos en `src/components/`
2. **Servicios**: Usar Serena MCP para encontrar servicios en `src/services/`
3. **Hooks**: Usar Glob para contar hooks en `src/hooks/`
4. **Páginas**: Usar Filesystem MCP para contar páginas en `src/app/`
5. **Utils**: Contar archivos en `src/utils/`
6. **Constantes**: Contar archivos en `src/constants/`
7. **Tests**: Usar Glob para encontrar archivos de test

### Fase 3: Validación de Stack
1. **Versiones Actuales**: Leer package.json con Read tool
2. **Documentación Externa**: Usar Context7 MCP para verificar versiones más recientes
3. **Componentes UI**: Usar Shadcn-UI MCP para contar componentes disponibles

### Fase 4: Arquitectura Firebase
1. **Colecciones**: Usar Firebase MCP para listar colecciones activas
2. **Configuración**: Verificar configuración actual del proyecto

### Fase 5: Estado del Proyecto
1. **Task Master**: Usar Task Master AI MCP para obtener estado de tareas
2. **Memory**: Usar Memory MCP para persistir métricas actualizadas

### Fase 6: Actualización de Archivos
1. **CLAUDE.md principal**: Actualizar métricas y stack tecnológico
2. **src/CLAUDE.md**: Actualizar métricas del directorio src/
3. **src/components/CLAUDE.md**: Actualizar métricas de componentes
4. **src/services/CLAUDE.md**: Actualizar lista de servicios
5. **src/app/CLAUDE.md**: Actualizar estructura de páginas

---

## MODO MÉTRICAS (metrics-only)

Actualizar solo las métricas numéricas sin cambiar contenido:

### Recolección Rápida:
1. **Contar archivos** con Filesystem MCP:
   - Componentes en `src/components/`
   - Servicios en `src/services/`
   - Hooks en `src/hooks/`
   - Utils en `src/utils/`
   - Páginas en `src/app/`

2. **Usar Serena MCP** para análisis semántico:
   - Contar símbolos por tipo
   - Verificar estructura actual

3. **Shadcn-UI MCP** para componentes disponibles

### Actualización Focalizada:
Usar MultiEdit para actualizar solo las secciones "📊 Métricas" en:
- CLAUDE.md (métricas principales)
- src/CLAUDE.md (métricas de src/)
- src/components/CLAUDE.md (métricas de componentes)
- src/services/CLAUDE.md (métricas de servicios)
- src/app/CLAUDE.md (métricas de páginas)

---

## MODO STACK (stack-only)

Actualizar solo las versiones del stack tecnológico:

### Proceso:
1. **Leer package.json actual** con Read tool
2. **Extraer versiones** de dependencias principales:
   - Next.js
   - React
   - TypeScript
   - Firebase
   - Otros del stack principal

3. **Actualizar solo sección "Stack Tecnológico"** en CLAUDE.md principal:
   - Frontend: Next.js X.X.X, React X.X.X, TypeScript X.X.X
   - Backend: Firebase X.X.X
   - Gestión de Estado: Zustand X.X.X
   - Formularios: React Hook Form X.X.X con Zod X.X.X
   - Pruebas: Jest X.X.X, Cypress X.X.X

---

## MODO VALIDACIÓN (validate-only)

Solo validar y reportar, sin modificar archivos:

### Validaciones:
1. **Shadcn-UI MCP**: Listar componentes disponibles
2. **Serena MCP**: Verificar componentes realmente usados
3. **Filesystem MCP**: Verificar estructura de archivos

### Reporte de Validación:
```
📊 REPORTE DE VALIDACIÓN
════════════════════════

✅ Componentes Shadcn-UI Disponibles: XX
✅ Componentes Propios Encontrados: XX
✅ Servicios Detectados: XX
✅ Páginas Encontradas: XX
✅ Hooks Identificados: XX

⚠️  DISCREPANCIAS ENCONTRADAS:
- Documentado: "50+ componentes" → Real: XX componentes
- Documentado: "11 servicios" → Real: XX servicios
- Documentado: "8 páginas" → Real: XX páginas

🔍 RECOMENDACIONES:
- Ejecutar `/actualizar_doc metrics-only` para corregir métricas
- Ejecutar `/actualizar_doc stack-only` para actualizar versiones
```

---

## MODO CONTEXTO (context-only)

Actualizar exclusivamente los archivos que proporcionan contexto automático a Claude Code:

### Fase 1: Identificación de Archivos de Contexto
Usar Sequential-Thinking MCP para analizar archivos de contexto:
- Identificar archivos CLAUDE.md existentes vs mencionados
- Planificar actualizaciones necesarias por dominio
- Determinar contenido específico por directorio

### Fase 2: Análisis por Dominio

#### **Contexto Principal (`CLAUDE.md`)**:
1. **Usar Multiple MCPs** para recopilar métricas actualizadas:
   - Filesystem MCP: Estructura general del proyecto
   - Serena MCP: Análisis semántico del código
   - Task Master AI MCP: Estado de tareas
   - Memory MCP: Información persistida

#### **Contexto src/ (`src/CLAUDE.md`)**:
1. **Usar Serena MCP** para análisis de estructura:
   - Contar servicios, hooks, utils, constantes
   - Identificar patrones arquitectónicos
   - Documentar dependencias clave

#### **Contexto Componentes (`src/components/CLAUDE.md`)**:
1. **Usar Shadcn-UI MCP + Filesystem MCP**:
   - Inventario completo de componentes UI propios
   - Lista actualizada de componentes Shadcn-UI disponibles
   - Patrones de diseño y uso

#### **Contexto Servicios (`src/services/CLAUDE.md`)**:
1. **Usar Serena MCP** para análisis semántico:
   - Lista detallada de servicios Firebase
   - Arquitectura de eventos y sincronización
   - Dependencias entre servicios

#### **Contexto App (`src/app/CLAUDE.md`)**:
1. **Usar Filesystem MCP** para estructura:
   - Mapeo de rutas Next.js
   - Páginas y funcionalidades disponibles
   - Configuración de routing

#### **Contexto MCPs (`.claude/mcp-guide.md`)**:
1. **Usar Memory MCP + análisis de configuración**:
   - Estado actual de MCPs conectados
   - Capacidades y casos de uso
   - Ejemplos de combinaciones poderosas

### Fase 3: Creación de Archivos Faltantes
**Identificar archivos mencionados pero no existentes:**
- `docs/claude/architecture.md` ❌
- `docs/claude/services-guide.md` ❌  
- `docs/claude/troubleshooting.md` ❌
- `docs/claude/testing-patterns.md` ❌

**Proceso de Creación:**
1. **Usar Sequential-Thinking MCP** para planificar contenido
2. **Usar Context7 MCP** para mejores prácticas de documentación
3. **Usar Serena MCP** para extraer información técnica relevante
4. **Crear estructura base** para cada archivo faltante

### Fase 4: Sincronización de Contenido
1. **Verificar consistencia** entre archivos de contexto
2. **Actualizar referencias cruzadas** entre documentos
3. **Sincronizar métricas** que aparecen en múltiples archivos
4. **Validar enlaces** a archivos y secciones

### Fase 5: Optimización para Claude Code
1. **Usar Memory MCP** para crear grafo de conocimiento:
   - Relaciones entre archivos de contexto
   - Flujos de trabajo por directorio
   - Patrones de carga automática

2. **Verificar carga automática**:
   - Confirmar paths relativos correctos
   - Validar sintaxis markdown
   - Probar referencias `@archivo`

### Archivos Actualizados en este Modo:
```
✅ ARCHIVOS EXISTENTES (actualización):
- CLAUDE.md (principal)
- src/CLAUDE.md
- src/app/CLAUDE.md  
- src/components/CLAUDE.md
- src/services/CLAUDE.md
- .claude/mcp-guide.md
- .taskmaster/CLAUDE.md

🆕 ARCHIVOS A CREAR:
- docs/claude/architecture.md
- docs/claude/services-guide.md
- docs/claude/troubleshooting.md
- docs/claude/testing-patterns.md
```

### Reporte de Contexto:
```
📚 REPORTE DE CONTEXTO CLAUDE CODE
═══════════════════════════════════

✅ Archivos de Contexto Actualizados: 7
🆕 Archivos de Contexto Creados: 4
🔄 Referencias Cruzadas Sincronizadas: XX
📊 Métricas Actualizadas en: XX archivos

🎯 COBERTURA POR DOMINIO:
- Contexto Principal: ✅ Completo
- Contexto src/: ✅ Completo  
- Contexto Componentes: ✅ Completo
- Contexto Servicios: ✅ Completo
- Contexto App: ✅ Completo
- Contexto MCPs: ✅ Completo
- Documentación Técnica: ✅ Completo

🚀 RESULTADO:
Claude Code ahora tiene contexto automático completo y actualizado
para todos los dominios del proyecto.
```

---

## Implementación

Iniciando actualización en modo: **[DETECTADO AUTOMÁTICAMENTE]**

[EJECUTAR FASE CORRESPONDIENTE BASADA EN ARGUMENTOS]

## Resultado

Documentación actualizada exitosamente usando el enfoque MCP-First con datos precisos del estado actual del proyecto.