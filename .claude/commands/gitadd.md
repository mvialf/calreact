# Comando Git Add Automático

Este comando ejecuta git add -A y crea un commit con un mensaje automático basado en los cambios detectados.

```bash
# Agregar todos los archivos al staging
git add -A

# Verificar cambios
changes=$(git diff --cached --name-only)
modified_files=$(git diff --cached --name-status | wc -l)

# Generar mensaje de commit basado en los cambios
if [ $modified_files -eq 0 ]; then
  echo "No hay cambios para commitear"
  exit 0
fi

# Analizar tipos de cambios para generar mensaje apropiado
added_files=$(git diff --cached --name-status | grep "^A" | wc -l)
modified_files=$(git diff --cached --name-status | grep "^M" | wc -l)
deleted_files=$(git diff --cached --name-status | grep "^D" | wc -l)

# Generar mensaje descriptivo
if [ $added_files -gt 0 ] && [ $modified_files -gt 0 ]; then
  message="feat: Agregar nuevos archivos y actualizar existentes"
elif [ $added_files -gt 0 ]; then
  message="feat: Agregar nuevos archivos al proyecto"
elif [ $modified_files -gt 0 ]; then
  message="update: Actualizar archivos existentes"
elif [ $deleted_files -gt 0 ]; then
  message="clean: Eliminar archivos obsoletos"
else
  message="chore: Actualizar proyecto"
fi

# Crear commit con mensaje automático
git commit -m "$message

🤖 Commit automático generado por comando gitadd
Co-Authored-By: Claude <noreply@anthropic.com>"

echo "✅ Commit creado: $message"
```