# /commandnew - Creador de Comandos Personalizados Claude Code

Crea comandos personalizados para Claude Code basándote en las mejores prácticas y la documentación oficial.

## Uso
```bash
/commandnew <nombre-comando> <descripción-funcionalidad>
```

## Instrucciones para el Asistente

Cuando recibas una solicitud `/commandnew`, sigue este proceso:

### 1. Análisis de Requisitos
- Extraer el nombre del comando solicitado
- Comprender la funcionalidad deseada
- Identificar argumentos necesarios
- Determinar el alcance del comando

### 2. Búsqueda de Comandos Similares
Antes de crear el comando, realizar búsqueda de comandos existentes:

**Fuentes de búsqueda:**
- Repositorios de GitHub con comandos Claude Code
- Documentación oficial de Claude Code
- Foros y comunidades (Stack Overflow, Reddit, Discord)
- Repositorios de awesome-lists relacionados

**Consultas de búsqueda sugeridas:**
```
"claude code commands" + <funcionalidad>
"claude-code custom commands" + <dominio>
"anthropic claude commands" + <tipo-tarea>
".claude/commands" + <nombre-similar>
```

**Proceso:**
1. Usar WebSearch para buscar comandos relacionados
2. Examinar repositorios relevantes encontrados
3. Documentar comandos similares encontrados
4. Preguntar al usuario si desea basarse en alguno específico

**Template de pregunta al usuario:**
```
He encontrado los siguientes comandos similares:

1. **[nombre-comando]** de [repositorio/fuente]
   - Funcionalidad: [descripción]
   - Características: [lista de features]
   - Link: [url]

2. **[nombre-comando-2]** de [repositorio/fuente-2]
   - Funcionalidad: [descripción]
   - Características: [lista de features]
   - Link: [url]

¿Te gustaría:
a) Basarte en uno de estos comandos existentes
b) Combinar características de varios
c) Crear uno completamente nuevo
d) Ver más opciones similares

Por favor indica tu preferencia.
```

### 3. Estructura del Comando
Crear un archivo Markdown siguiendo este template:

```markdown
---
title: "<Nombre del Comando>"
description: "<Descripción breve>"
author: "Claude Code"
version: "1.0.0"
tags: ["<categoria>", "<tipo>"]
---

# /<nombre-comando> - <Título Descriptivo>

<Descripción detallada de la funcionalidad>

## Uso
\```
/<nombre-comando> [argumentos]
\```

## Argumentos
- `argumento1`: Descripción del argumento
- `argumento2`: (Opcional) Descripción del argumento opcional

## Instrucciones
<Instrucciones detalladas para Claude sobre cómo ejecutar el comando>

## Ejemplos
\```
/<nombre-comando> ejemplo1
/<nombre-comando> ejemplo2 --opcion
\```

## Notas
- Limitaciones conocidas
- Consideraciones especiales
- Dependencias requeridas
```

### 4. Mejores Prácticas a Seguir

**Nomenclatura:**
- Nombres descriptivos y concisos
- Usar guiones para separar palabras
- Evitar conflictos con comandos built-in

**Funcionalidad:**
- Una responsabilidad principal por comando
- Soporte para argumentos dinámicos con `$ARGUMENTS`
- Manejo de errores apropiado
- Documentación clara

**Integración con el Proyecto:**
- Considerar contexto del proyecto actual
- Usar patrones establecidos en CLAUDE.md
- Integrar con servicios existentes si aplica
- Seguir convenciones del codebase
- **Basar en comandos encontrados:** Si el usuario seleccionó comandos de referencia, adaptar e integrar sus mejores características

### 5. Tipos de Comandos Comunes

**Desarrollo:**
- Generación de código
- Refactoring automático
- Análisis de codebase
- Testing y validación

**Documentación:**
- Generación de README
- Actualización de docs
- Creación de changelogs
- Documentación de APIs

**Workflow:**
- Automatización de tareas
- Integración con Git
- Deploy y build
- Monitoreo y debugging

### 6. Funcionalidades Avanzadas

**Comandos con Bash:**
```markdown
## Ejecución
!echo "Ejecutando comando..."
!npm run build
```

**Referencias a Archivos:**
```markdown
## Context
@src/components/
@package.json
```

**Argumentos Dinámicos:**
```markdown
Procesando argumento: $ARGUMENTS
```

### 7. Validación y Testing

Antes de finalizar el comando:
- Verificar sintaxis Markdown
- Validar estructura YAML frontmatter
- Comprobar que las instrucciones sean claras
- Testear con ejemplos proporcionados

### 8. Ubicación del Archivo

Crear el archivo en la ruta apropiada:
- Proyecto: `.claude/commands/<nombre-comando>.md`
- Usuario: `~/.config/claude-code/commands/<nombre-comando>.md`

### 9. Entrega Final

Proporcionar:
1. **Resumen de búsqueda:** Comandos similares encontrados y decisión del usuario
2. Archivo del comando completo
3. Instrucciones de instalación
4. Ejemplos de uso
5. Documentación de limitaciones
6. **Referencias:** Links a comandos que sirvieron de inspiración (si aplica)

## Categorías de Comandos Disponibles

- **dev**: Desarrollo y coding
- **docs**: Documentación
- **test**: Testing y QA
- **git**: Control de versiones
- **build**: Build y deployment
- **analysis**: Análisis de código
- **refactor**: Refactoring
- **util**: Utilidades generales

Inicia la creación del comando procesando los argumentos proporcionados después de "/commandnew".