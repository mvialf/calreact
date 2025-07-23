# Instrucciones para Limpiar Horas de Fechas de Visitas

## Resumen
Se ha eliminado la visualización de horas en las fechas de visitas. Ahora solo se muestra la fecha (dd/MM/yyyy) sin la hora. Para mantener consistencia en la base de datos, necesitas limpiar las fechas existentes en Firestore.

## Cambios Realizados en el Código

### 1. Página de Visitas (`src/app/visits/page.tsx`)
- ✅ **Función formatDate**: Cambiada de `'dd/MM/yyyy HH:mm'` a `'dd/MM/yyyy'`
- ✅ **Encabezado de tabla**: Cambiado de "Fecha de Visita" a "Fecha Programada"

### 2. Formulario de Visitas (`src/components/forms/VisitForm.tsx`)
- ✅ **Ya estaba correcto**: Usa `InputDate` que solo maneja fechas, no horas

## Opciones para Limpiar Datos en Firestore

### Opción 1: Página de Administración Web (RECOMENDADA)

1. **Navega a la página de administración**:
   ```
   http://localhost:3002/admin/cleanup
   ```

2. **Ejecuta la limpieza**:
   - Haz clic en "Limpiar Fechas"
   - Espera a que termine el proceso
   - Revisa los resultados

3. **Ventajas**:
   - ✅ Interfaz gráfica fácil de usar
   - ✅ Muestra progreso y resultados
   - ✅ Manejo de errores integrado
   - ✅ No requiere configuración adicional

### Opción 2: Consola del Navegador

1. **Abre las herramientas de desarrollador** (F12)
2. **Ve a la consola**
3. **Ejecuta el siguiente código**:
   ```javascript
   // Importar la función (solo si no está disponible)
   const { cleanVisitTimes } = await import('/src/utils/cleanVisitTimes.ts');
   
   // Ejecutar la limpieza
   const result = await cleanVisitTimes();
   console.log('Resultado:', result);
   ```

### Opción 3: Script Node.js (Para desarrolladores avanzados)

1. **Configura las variables de entorno**:
   - Crea un archivo `.env.local` con tus credenciales de Firebase
   - O modifica el script para usar credenciales de servicio

2. **Instala dependencias** (si es necesario):
   ```bash
   npm install dotenv
   ```

3. **Ejecuta el script**:
   ```bash
   node scripts/clean-visit-times-client.js
   ```

## Verificación de Resultados

Después de ejecutar la limpieza:

1. **Refresca la página de visitas**: `http://localhost:3002/visits`
2. **Verifica que las fechas se muestren sin hora**: Deberías ver fechas como "20/05/2025" en lugar de "20/05/2025 20:00"
3. **Comprueba que las funcionalidades sigan funcionando**:
   - Crear nueva visita
   - Editar visita existente
   - Filtrar visitas

## Archivos Creados

- `src/utils/cleanVisitTimes.ts` - Utilidad de limpieza reutilizable
- `src/app/admin/cleanup/page.tsx` - Página de administración web
- `scripts/clean-visit-times.js` - Script con Firebase Admin SDK
- `scripts/clean-visit-times-client.js` - Script con Firebase Client SDK

## Notas Importantes

⚠️ **Respaldo**: Aunque la operación es segura, considera hacer un respaldo de Firestore antes de ejecutar.

✅ **Reversible**: Los cambios no son automáticamente reversibles, pero puedes restaurar desde un respaldo.

🔧 **Desarrollo**: La página de administración es temporal y puede eliminarse después de la limpieza.

## Solución de Problemas

### Error de Permisos
Si obtienes errores de permisos:
1. Verifica que las reglas de Firestore permitan escritura
2. Asegúrate de estar autenticado correctamente

### Error de Conexión
Si hay problemas de conexión:
1. Verifica tu conexión a internet
2. Comprueba que las credenciales de Firebase sean correctas

### Variables de Entorno Faltantes
Si faltan variables de entorno:
1. Crea un archivo `.env.local` con las credenciales de Firebase
2. Reinicia el servidor de desarrollo

## Contacto

Si tienes problemas con la limpieza, revisa los logs en la consola del navegador o en la terminal para obtener más detalles sobre los errores.
