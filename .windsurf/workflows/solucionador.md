---
description: solucion de problemas
---

Actúa como un desarrollador senior experto en depuración y soluciones robustas. Tu misión es diagnosticar y solucionar de forma definitiva un problema en el proyecto

Tu proceso debe ser metódico, iterativo y a prueba de fallos. No te conformes con la primera solución que encuentres. Debes asegurarte de que la solución sea la más óptima, segura y que no introduzca efectos secundarios no deseados.

Utiliza todas tus capacidades de la siguiente manera:

1.  **Análisis Inicial (Conciencia del Contexto y Memorias):**
    * Basándote en tu conocimiento completo de la base de código, analiza a fondo los archivos que podrían estar implicados. Empieza por **[lista los archivos de partida, ej: `cartController.js`, `promoService.js`]**, pero extiende tu análisis a donde sea necesario.
    * Considera el contexto de nuestras conversaciones previas sobre este módulo para acelerar tu diagnóstico.
    * Preséntame un resumen inicial de la causa raíz más probable del problema.

2.  **Investigación y Múltiples Enfoques (Web Search):**
    * Utiliza **Web Search** para investigar posibles causas del problema, como **[ejemplo de búsqueda: "errores de redondeo en JavaScript con moneda"]** o para encontrar las mejores prácticas de la industria para implementar **[ejemplo: "la validación de cupones en un backend de Node.js"]**.
    * Identifica al menos dos posibles estrategias de solución. Compáralas brevemente en términos de eficiencia, legibilidad y robustez.

3.  **Implementación de la Solución (Write Mode / Inline AI / Cascade):**
    * Selecciona la mejor estrategia y comienza a implementarla.
    * Usa **Write Mode** o **Inline AI** para generar o modificar el código necesario.
    * Si la solución requiere modificaciones en varios archivos (ej: un servicio, su controlador y las pruebas correspondientes), utiliza **Cascade** para aplicar los cambios de manera coherente y mantener todo el sistema sincronizado.

4.  **Validación y Pruebas Exhaustivas (Terminal y Generación de Código):**
    * **Esta es la fase más crítica.** Tu solución no se considera completa hasta que esté rigurosamente probada.
    * **Genera un nuevo conjunto de pruebas unitarias y de integración** para la funcionalidad modificada. Estas pruebas deben cubrir obligatoriamente los siguientes escenarios:
        * **Caso de éxito 1:** [Describe el primer criterio de éxito, ej: "Carrito con 3 items y un descuento porcentual del 15%"].
        * **Caso de éxito 2:** [Describe el segundo criterio, ej: "Carrito con 1 item y un descuento de monto fijo de $10"].
        * **Caso borde:** [Describe un caso límite, ej: "Aplicar un cupón a un carrito vacío"].
        * **Caso de error:** [Describe un caso de fallo esperado, ej: "Aplicar un cupón inválido o expirado"].
    * Una vez generadas las pruebas, usa el **Terminal** para ejecutar todo el suite de tests del proyecto (`npm test`, `pytest`, etc.) y confirma que tu cambio no ha introducido ninguna regresión.

5.  **Informe Final:**
    * Si alguna de las pruebas falla, **vuelve al paso 2** y replantea la solución. Repite el ciclo hasta que todas las pruebas pasen.
    * Una vez que la solución esté implementada y completamente verificada, preséntame el resultado final que debe incluir:
        1.  El código final, limpio y comentado.
        2.  El código de las nuevas pruebas que has generado.
        3.  Una explicación concisa de la causa raíz del problema y cómo tu solución lo resuelve de manera definitiva.

Comienza el análisis ahora.