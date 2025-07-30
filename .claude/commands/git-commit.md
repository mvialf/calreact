---
title: "Git Commit Inteligente"
description: "Comando para añadir archivos, crear commits con mensajes automáticos y mostrar estado final"
author: "Claude Code"
version: "1.0.0"
tags: ["git", "commit", "workflow", "automation"]
---

# /git-commit - Workflow Completo de Git Commit

Automatiza el proceso completo de commit: añade archivos modificados/nuevos, elimina archivos borrados, crea commits con mensajes inteligentes y muestra el estado final.

## Uso
```
/git-commit [mensaje personalizado]
```

## Argumentos
- `mensaje personalizado`: (Opcional) Mensaje de commit personalizado. Si no se proporciona, se genera automáticamente basado en los cambios.

## Instrucciones

### 1. Preparar Archivos para Commit
Ejecuta los siguientes comandos para preparar todos los cambios:

```bash
# Añadir todos los archivos modificados y nuevos
git add .

# Eliminar archivos que fueron borrados del working directory
git add -u
```

### 2. Verificar Estado Antes del Commit
```bash
# Mostrar estado actual
git status --porcelain

# Mostrar diff de los cambios staged
git diff --cached --stat
```

### 3. Generar Mensaje de Commit

**Si se proporcionaron argumentos:**
- Usar los argumentos como mensaje de commit exacto

**Si NO se proporcionaron argumentos:**
- Analizar los archivos modificados usando `git diff --cached --name-status`
- Generar un mensaje siguiendo estas reglas:
  - **Formato**: `tipo(scope): descripción`
  - **Tipos disponibles**:
    - `feat`: Nueva funcionalidad
    - `fix`: Corrección de errores
    - `docs`: Solo cambios en documentación
    - `style`: Cambios de formato, espacios, etc.
    - `refactor`: Refactorización de código
    - `test`: Añadir o modificar tests
    - `chore`: Cambios en build, dependencias, etc.
    - `perf`: Mejoras de rendimiento
    - `ci`: Cambios en CI/CD
  - **Scope**: Usar el directorio principal afectado o componente
  - **Descripción**: Imperativo, primera letra minúscula, máximo 50 caracteres
  - **Ejemplos**:
    - `feat(calendar): agregar modal para eventos de proyecto`
    - `fix(forms): resolver error de validación en NewProjectEventForm`
    - `refactor(services): optimizar queries de Firebase`
    - `docs: actualizar README con nuevas funcionalidades`

### 4. Crear el Commit
```bash
# Crear commit con el mensaje determinado
git commit -m "{mensaje_generado_o_proporcionado}"
```

### 5. Mostrar Estado Final
```bash
# Mostrar estado post-commit
git status

# Mostrar el último commit creado
git log --oneline -1

# Mostrar resumen de cambios incluidos
echo "✅ Commit creado exitosamente"
```

## Lógica de Generación de Mensajes Automáticos

Cuando no se proporcionan argumentos, analizar los cambios y seguir esta lógica:

1. **Identificar tipo principal de cambio**:
   - Si hay archivos nuevos en `src/components/` → `feat(components)`
   - Si hay modificaciones en archivos de test → `test`
   - Si solo hay cambios en `README.md`, `docs/` → `docs`
   - Si hay cambios en `package.json`, `tsconfig.json` → `chore`
   - Si hay correcciones de errores evidentes → `fix`
   - Por defecto → `refactor`

2. **Determinar scope**:
   - Usar el directorio más afectado: `components`, `services`, `types`, `utils`
   - Si afecta múltiples áreas → usar `core` o `app`

3. **Crear descripción**:
   - Resumir la acción principal en máximo 50 caracteres
   - Usar modo imperativo: "agregar", "corregir", "actualizar"
   - Primera letra minúscula

## Ejemplos

### Ejemplo 1: Mensaje automático
```bash
# Comando
/git-commit

# Resultado (si se modificaron archivos en src/components/calendar/)
git add .
git add -u
git commit -m "feat(calendar): mejorar componente CalendarEvent con ProjectClientDisplay"
git status
```

### Ejemplo 2: Mensaje personalizado
```bash
# Comando  
/git-commit Resolver errores TypeScript en NewProjectEventModal

# Resultado
git add .
git add -u
git commit -m "Resolver errores TypeScript en NewProjectEventModal"
git status
```

### Ejemplo 3: Múltiples cambios
```bash
# Comando
/git-commit

# Resultado (si hay cambios en servicios, tipos y componentes)
git add .
git add -u  
git commit -m "refactor(core): optimizar tipos y servicios para eventos de proyecto"
git status
```

## Notas

- **Seguridad**: El comando siempre muestra qué archivos se van a commitear antes de hacerlo
- **Rollback**: Si algo sale mal, usar `git reset --soft HEAD~1` para deshacer el último commit
- **Branching**: Verifica estar en la rama correcta antes de usar el comando
- **Staged files**: Si ya hay archivos en staging, los incluirá en el commit
- **Ignored files**: Respeta `.gitignore` automáticamente

## Dependencias

- Git debe estar instalado y configurado
- Repositorio debe estar inicializado
- Usuario debe tener permisos de commit

## Troubleshooting

- Si no hay cambios: El comando informará "nothing to commit"
- Si hay conflictos: Resolver manualmente antes de usar el comando
- Si falla el commit: Verificar configuración de git user.name y user.email