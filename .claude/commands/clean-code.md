---
description: "Analiza el código para identificar duplicados, código innecesario y anti-patrones"
allowed-tools: ["Glob", "Read", "Grep", "Write", "LS"]
---

# Clean Code Analysis

Realiza un análisis completo del código para identificar:

## Objetivos del Análisis
1. **Archivos duplicados**: Identifica archivos que realizan funciones similares
2. **Código muerto**: Detecta código no utilizado o obsoleto
3. **Anti-patrones**: Encuentra violaciones de principios SOLID, DRY, KISS
4. **Inconsistencias arquitecturales**: Verifica adherencia a la estructura definida
5. **Optimizaciones**: Sugiere mejoras de rendimiento y escalabilidad

## Proceso de Análisis
1. Escanea la estructura completa del proyecto
2. Identifica patrones de duplicación
3. Analiza importaciones no utilizadas
4. Revisa consistencia de nomenclatura
5. Verifica adherencia a arquitectura establecida

## Resultados
- Genera `docs/cleanAnalisis.md` con análisis detallado
- Crea `docs/cleanToDo.md` con tareas prioritizadas
- Proporciona métricas de calidad de código
- Sugiere refactorizaciones específicas

## Criterios de Evaluación
- **Duplicación**: Archivos con >70% similitud funcional
- **Uso**: Archivos sin importaciones activas
- **Arquitectura**: Violaciones a estructura src/ definida
- **Naming**: Inconsistencias en convenciones
- **Performance**: Oportunidades de optimización

Comenzando análisis del proyecto $ARGUMENTS...

!mkdir -p docs

Analizando estructura del proyecto para identificar código innecesario y oportunidades de mejora según las mejores prácticas definidas en CLAUDE.md.