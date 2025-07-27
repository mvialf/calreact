# 🔍 Prompt para Análisis de Código y Arquitectura

## Contexto
Este prompt está diseñado para solicitar un análisis exhaustivo del proyecto por parte de Claude Code u otro asistente de IA especializado en desarrollo de software. El prompt es genérico y se adapta automáticamente al proyecto mediante la lectura del archivo CLAUDE.md.

---

## 📋 Prompt Principal

```
**Rol:** Eres un experto analista de código y arquitecto de software con experiencia en análisis arquitectónico, calidad de código y mejores prácticas de desarrollo.

**Tarea:** Analiza exhaustivamente este proyecto de código y proporciona un informe detallado con sugerencias de mejora. El objetivo es mejorar la claridad, estructura, robustez, mantenibilidad y escalabilidad del proyecto.

**Instrucciones Iniciales:**
1. Lee y analiza primero el archivo CLAUDE.md para entender:
   - La arquitectura y tecnologías del proyecto
   - Los principios de desarrollo establecidos
   - Las convenciones y patrones requeridos
   - La estructura de directorios obligatoria
   - Las configuraciones y herramientas utilizadas

2. Usa la información del CLAUDE.md como base de referencia para evaluar si la implementación actual cumple con los estándares documentados.

**Áreas de Análisis Requeridas:**

1. **Arquitectura General**
   - Estructura de directorios y organización según CLAUDE.md
   - Patrones de diseño implementados vs documentados
   - Separación de responsabilidades
   - Consistencia arquitectónica
   - Adherencia a la estructura obligatoria definida

2. **Calidad de Código**
   - Adherencia a principios SOLID, DRY, KISS, YAGNI documentados
   - Duplicación de código (violaciones del principio DRY)
   - Complejidad ciclomática
   - Consistencia en naming y convenciones establecidas
   - Cumplimiento de reglas de implementación TypeScript/React

3. **Configuración y Herramientas**
   - Configuración de build y herramientas vs especificaciones
   - Setup de testing según filosofía documentada
   - Configuración de servicios backend
   - Variables de entorno y configuraciones requeridas

4. **Componentes y Sistema de Diseño**
   - Reutilización de componentes según patrones establecidos
   - Consistencia con el sistema de diseño documentado
   - Accesibilidad obligatoria según estándares
   - Adherencia a convenciones de estilos

5. **Servicios y Lógica de Negocio**
   - Implementación del patrón de servicios documentado
   - Inyección de dependencias vs instancias globales
   - Manejo de errores según estrategia establecida
   - Operaciones de base de datos y transacciones

6. **Tipos y Validaciones**
   - Estructura de tipos según organización definida
   - Consistencia en tipado TypeScript
   - Validaciones según herramientas especificadas
   - Centralización de constantes vs valores mágicos

**Metodología de Análisis:**
1. Compara la implementación actual con los estándares documentados en CLAUDE.md
2. Identifica desviaciones de los principios establecidos
3. Evalúa la consistencia entre documentación y código
4. Prioriza problemas según impacto en mantenibilidad y robustez

**Criterios de Evaluación:**
- Cumplimiento de principios documentados (SOLID, DRY, KISS, YAGNI)
- Adherencia a estructura de archivos obligatoria
- Implementación correcta de patrones arquitectónicos
- Consistencia con convenciones establecidas
- Calidad de separación de responsabilidades
- Mantenibilidad y escalabilidad del código

**Criterios de Priorización:**
- **Crítico**: Violaciones que pueden causar bugs o inconsistencias de datos
- **Alto**: Desviaciones de patrones arquitectónicos centrales
- **Medio**: Problemas de mantenibilidad y developer experience
- **Bajo**: Optimizaciones incrementales y mejores prácticas

**Evidencia Requerida:**
Para cada problema identificado, incluye:
- **Ubicación exacta**: archivo y número de línea
- **Código problemático**: snippet específico
- **Estándar violado**: referencia exacta a CLAUDE.md
- **Código corregido**: ejemplo de implementación correcta
- **Justificación**: por qué es importante corregirlo

**Salida Esperada:**
Genera un informe detallado en formato Markdown que incluya:

1. **Resumen Ejecutivo**
   - Evaluación general de cumplimiento con CLAUDE.md
   - Principales desviaciones identificadas
   - Puntuación de adherencia a estándares

2. **Análisis de Cumplimiento por Área**
   - Comparación implementación vs documentación
   - Problemas específicos con ejemplos de código
   - Impacto de cada desviación

3. **Sugerencias de Corrección Priorizadas**
   - Correcciones para alinear con estándares documentados
   - Ejemplos de código corregido
   - Justificación basada en principios establecidos

4. **Plan de Alineación**
   - Fases para corregir desviaciones
   - Orden de implementación recomendado
   - Métricas de cumplimiento

Examina todos los archivos relevantes del proyecto y compáralos sistemáticamente con los estándares documentados en CLAUDE.md. Proporciona un análisis objetivo que permita alinear completamente la implementación con la documentación establecida.
```

---

---

## 🔄 Uso del Prompt

### **Instrucciones de Uso:**

1. **Copia el contenido del "Prompt Principal"** (desde **Rol:** hasta el final del bloque de código)
2. **Pégalo en una nueva conversación** con Claude Code u otro asistente de IA especializado
3. **Asegúrate de que el asistente tenga acceso** al archivo CLAUDE.md del proyecto
4. **El análisis se ejecutará automáticamente** siguiendo la metodología establecida

### **Adaptación para Otros Proyectos:**

- **Sin modificaciones necesarias**: El prompt es completamente genérico
- **Requisito único**: El proyecto debe tener un archivo CLAUDE.md documentando estándares
- **Escalable**: Funciona para proyectos de cualquier tamaño o tecnología

### **Frecuencia Recomendada:**

- **Análisis inicial**: Al incorporar nuevos desarrolladores
- **Revisiones periódicas**: Cada 2-3 sprints de desarrollo
- **Pre-releases**: Antes de versiones importantes
- **Post-refactoring**: Después de cambios arquitectónicos significativos

---

## 📄 Complemento: Archivo de Tareas

Este prompt genera un análisis. Para la **implementación práctica** de las mejoras identificadas, consulta el archivo `task.md` que contiene:

- **Tareas específicas** priorizadas y estructuradas
- **Metodología de ingeniería de contexto** para gestión de mejoras
- **Templates** para nuevas tareas de desarrollo
- **Métricas de seguimiento** y validación de progreso