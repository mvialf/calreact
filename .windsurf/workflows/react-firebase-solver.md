---
description: Solucionador específico para problemas de React/Firebase
---

# Workflow: Solucionador de Problemas React/Firebase

Este workflow está optimizado para diagnosticar y resolver problemas específicos de aplicaciones React con Firebase.

## Pasos del Proceso

### 1. Diagnóstico Preciso

1. **Reproducir y documentar el problema**
   - Registrar los pasos exactos para reproducir el error
   - Capturar los mensajes de error de la consola
   - Identificar en qué componente específico se produce el problema

2. **Analizar el componente problemático**
   ```bash
   # Ver la estructura del archivo principal
   npx @windsurf/cascade view_file_outline --AbsolutePath="[ruta-del-archivo]" --ItemOffset=0
   
   # Buscar patrones problemáticos comunes
   npx @windsurf/cascade grep_search --SearchPath="[directorio-del-componente]" --Query="useEffect" --MatchPerLine=true --Includes=["*.tsx", "*.ts"] --CaseInsensitive=true --IsRegex=false
   
   # Identificar suscripciones a Firebase que podrían no limpiarse
   npx @windsurf/cascade grep_search --SearchPath="[directorio-del-componente]" --Query="onSnapshot" --MatchPerLine=true --Includes=["*.tsx", "*.ts"] --CaseInsensitive=true --IsRegex=false
   ```

3. **Examinar integración con Firebase**
   - Verificar patrones de consulta a Firestore (uso correcto de `where`, `orderBy`, etc.)
   - Comprobar el manejo de transacciones
   - Revisar gestión de memoria con `useEffect` y limpieza de suscripciones

### 2. Aislamiento y Verificación

1. **Implementar logs estratégicos**
   ```tsx
   // Añadir al componente problemático:
   useEffect(() => {
     console.group('Ciclo de vida del componente');
     console.log('Props:', props);
     console.log('Estado actual:', state);
     
     return () => {
       console.log('Limpieza del efecto');
       console.groupEnd();
     };
   }, [dependencias]);
   ```

2. **Crear un caso de prueba mínimo**
   - Duplicar el componente aislando solo la funcionalidad problemática
   - Probar con datos simulados (mocks)

### 3. Implementación de la Solución

1. **Refactorizar para seguir patrones óptimos**
   - Extraer lógica de Firebase a hooks personalizados
   - Implementar patrón de carga/error/data
   - Asegurar limpieza de recursos

2. **Ejemplo de hook personalizado para Firestore**
   ```tsx
   function useFirestoreCollection(collectionPath, queryConstraints = []) {
     const [status, setStatus] = useState('loading');
     const [data, setData] = useState([]);
     const [error, setError] = useState(null);
     
     useEffect(() => {
       setStatus('loading');
       const q = query(collection(db, collectionPath), ...queryConstraints);
       
       const unsubscribe = onSnapshot(q, 
         (snapshot) => {
           const items = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setData(items);
           setStatus('success');
         },
         (err) => {
           console.error(err);
           setError(err);
           setStatus('error');
         }
       );
       
       return () => unsubscribe();
     }, [collectionPath, JSON.stringify(queryConstraints)]);
     
     return { status, data, error };
   }
   ```

### 4. Pruebas y Validación

1. **Ejecutar pruebas específicas**
   ```bash
   # Pruebas de componentes React
   npm test -- --testPathPattern=src/components/projects
   
   # Probar la aplicación en modo de desarrollo
   npm run dev
   ```

2. **Verificar rendimiento**
   - Usar React DevTools para verificar renderizados innecesarios
   - Confirmar que no hay fugas de memoria
   - Validar que las consultas a Firestore están optimizadas

### 5. Cierre y Documentación

1. **Documentar la solución**
   - Añadir comentarios en el código explicando la solución
   - Actualizar README o documentación técnica

2. **Aplicar medidas preventivas**
   - Crear componentes de error boundary
   - Implementar validaciones
   - Considerar un sistema de logging más robusto para producción

## Patrones Comunes para Revisar

- Falta de limpieza en `useEffect`
- Dependencias incorrectas en `useEffect` o `useMemo`
- Consultas ineficientes a Firestore (sin índices)
- Uso incorrecto de async/await con Firebase
- Renderizaciones innecesarias

## Recursos Útiles

- [Firebase React Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firebase Performance Dashboard](https://console.firebase.google.com/project/_/performance)
- [React DevTools Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)