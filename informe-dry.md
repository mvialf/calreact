# Informe de Análisis DRY (Don't Repeat Yourself)

## Introducción

Este informe detalla las áreas identificadas en la base de código que incumplen el principio DRY. La duplicación de código aumenta la complejidad, dificulta el mantenimiento y es una fuente potencial de errores. A continuación, se presentan los hallazgos y las sugerencias para refactorizar y mejorar la calidad del código.

---

## 1. Duplicación en Hooks de Obtención y Procesamiento de Datos

Se ha detectado una duplicación severa de la lógica para obtener, combinar y procesar datos de múltiples fuentes de React Query.

- **Archivos Implicados:**
  - `src/hooks/useProjectsData.ts`
  - `src/hooks/usePaymentsData.ts`

- **Fragmento de Código Duplicado (Patrón):**

Ambos hooks repiten la misma estructura:

```typescript
// Patrón repetido en ambos hooks
export const useSomeData = () => {
  // 1. Múltiples llamadas a useQuery para obtener distintas entidades
  const { data: dataA = [], isLoading: isLoadingA } = useQuery({ queryKey: ['A'], queryFn: getA });
  const { data: dataB = [], isLoading: isLoadingB } = useQuery({ queryKey: ['B'], queryFn: getB });
  const { data: dataC = [], isLoading: isLoadingC } = useQuery({ queryKey: ['C'], queryFn: getC });

  // 2. Lógica de "enriquecimiento" dentro de un useMemo
  const enrichedData = useMemo(() => {
    if (isLoadingA || isLoadingB || isLoadingC) return [];
    
    // Lógica para combinar datos A, B y C
    return dataA.map(item => ({
      ...item,
      // ...propiedades enriquecidas
    }));
  }, [dataA, dataB, dataC, isLoadingA, isLoadingB, isLoadingC]);

  // 3. Manejo idéntico de estados combinados de carga y error
  const isLoading = isLoadingA || isLoadingB || isLoadingC;
  const isError = /* ... */;
  const error = /* ... */;

  return { data: enrichedData, isLoading, isError, error };
};
```

- **Sugerencia de Refactorización:**

Crear un hook genérico, por ejemplo `useCombinedQuery`, que centralice esta lógica. Este hook podría aceptar un objeto de configuración con las queries a ejecutar y una función de transformación.

**Ejemplo de implementación:**

```typescript
// src/hooks/useCombinedQuery.ts
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

function useCombinedQuery(queries, transformFn) {
  const results = useQueries({ queries });

  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);
  const error = results.find(r => r.isError)?.error;

  const data = useMemo(() => {
    if (isLoading || isError) return [];
    const queryData = results.map(r => r.data);
    return transformFn(queryData);
  }, [isLoading, isError, ...results.map(r => r.data)]);

  return { data, isLoading, isError, error };
}
```

Con este hook, `useProjectsData` y `usePaymentsData` se simplificarían drásticamente, conteniendo únicamente la lógica de transformación específica para cada caso, eliminando así toda la lógica repetida.

---

## 2. Duplicación en Componentes de Página con Tablas de Datos

Se ha observado una gran cantidad de lógica de UI duplicada en las páginas que renderizan tablas de datos.

- **Archivos Implicados:**
  - `src/app/projects/page.tsx`
  - `src/app/payments/page.tsx`

- **Fragmento de Código Duplicado (Patrón):**

Ambos componentes contienen lógica repetida para:

  - **Gestión de estado:** Múltiples `useState` para filtros, ordenación, paginación y selección.
  - **Cálculos memoizados:** `useMemo` para filtrar y ordenar los datos según el estado actual.
  - **Renderizado de la tabla:** La estructura JSX para `Card`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` es casi idéntica.
  - **Renderizado de la paginación:** Uso del componente `TablePagination` con la misma configuración.
  - **Manejo de diálogos de confirmación:** `AlertDialog` para operaciones de eliminación.

```jsx
// Patrón de estado y lógica repetido en ambos componentes de página
const [filter, setFilter] = useState('');
const [sortBy, setSortBy] = useState('createdAt');
const [sortOrder, setSortOrder] = useState('desc');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

const filteredAndSortedData = useMemo(() => {
  // ...lógica de filtrado y ordenación idéntica...
}, [data, filter, sortBy, sortOrder]);

// ... JSX para la tabla, paginación y diálogos ...
```

- **Sugerencia de Refactorización:**

Abstraer la lógica y la presentación de la tabla en componentes y hooks reutilizables:

  1.  **Crear un hook `useDataTable`:** Este hook encapsularía toda la lógica de estado y manipulación de datos (filtrado, ordenación, paginación, selección). Recibiría los datos brutos y devolvería los datos procesados y los manejadores de eventos (`handleSort`, `setFilter`, etc.).

  2.  **Crear un componente genérico `DataTable`:** Este componente se encargaría del renderizado. Recibiría los datos y manejadores del hook `useDataTable`, junto con una configuración de columnas (un array de objetos que define el `header`, la celda a renderizar, etc.). Esto permitiría reutilizar toda la estructura de la tabla, incluyendo cabeceras, cuerpo, esqueletos de carga y mensajes de "no hay resultados".

  3.  **Crear un componente `ConfirmationDialog`:** Abstraer el `AlertDialog` para que pueda ser reutilizado para cualquier operación que requiera confirmación del usuario, simplemente pasándole un título, descripción y una función `onConfirm`.

La implementación de estas abstracciones reduciría los componentes de página a una configuración de columnas y el paso de datos a los componentes y hooks genéricos, mejorando drásticamente la mantenibilidad y legibilidad.
