# Análisis Exhaustivo de Código

Eres un experto analista de código y arquitecto de software. Analiza exhaustivamente este proyecto siguiendo la metodología documentada.

## Instrucciones de Análisis

**Paso 1: Lectura de Documentación**
- Lee y analiza primero el archivo CLAUDE.md para entender la arquitectura, principios y convenciones del proyecto
- Usa CLAUDE.md como referencia única para evaluar el cumplimiento de estándares

**Paso 2: Verificación del Estado Actual**
Ejecuta estos comandos y documenta los resultados:
- `npm run typecheck` - Errores TypeScript actuales
- `npm run lint` - Warnings ESLint actuales
- `npm run test` - Estado de las pruebas
- `npm run build` - Problemas de build

**Paso 3: Análisis por Áreas**

### 1. Arquitectura General
- Estructura de directorios vs CLAUDE.md
- Patrones de diseño implementados vs documentados
- Separación de responsabilidades
- Adherencia a estructura obligatoria

### 2. Calidad de Código
- Principios SOLID, DRY, KISS, YAGNI
- Duplicación de código
- Convenciones de naming
- Reglas TypeScript/React

### 3. Servicios y Lógica de Negocio
- Patrón de servicios e inyección de dependencias
- Manejo de errores
- Operaciones de base de datos
- Transacciones atómicas

### 4. Componentes y UI
- Reutilización según patrones establecidos
- Sistema de diseño y accesibilidad
- Convenciones de estilos

### 5. Configuración y Herramientas
- Setup vs especificaciones
- Testing según filosofía documentada
- Variables de entorno

### 6. Tipos y Validaciones
- Estructura según organización definida
- Consistencia en tipado
- Centralización de constantes

## Criterios de Priorización

- **Crítico**: Violaciones que causan bugs o inconsistencias de datos
- **Alto**: Desviaciones de patrones arquitectónicos centrales
- **Medio**: Problemas de mantenibilidad y developer experience
- **Bajo**: Optimizaciones incrementales

## Evidencia Requerida

Para cada problema:
- **Ubicación exacta**: archivo y línea
- **Código problemático**: snippet específico
- **Estándar violado**: referencia a CLAUDE.md
- **Código corregido**: implementación correcta
- **Justificación**: impacto de no corregir

## Formato del Informe

Genera informe con:
1. **Resumen Ejecutivo** - Cumplimiento general con CLAUDE.md
2. **Análisis por Área** - Comparación implementación vs documentación
3. **Sugerencias Priorizadas** - Correcciones con ejemplos
4. **Plan de Alineación** - Fases y métricas de cumplimiento

Proporciona análisis objetivo que permita alinear completamente la implementación con CLAUDE.md.