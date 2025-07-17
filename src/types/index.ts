// Archivo índice para exportar todos los tipos del proyecto
export * from './afterSales';
export * from './client';
export * from './event';
export * from './payment';
export * from './project';
export * from './visit';

// Importar tipos específicos para testing (aunque no es necesario exportarlos explícitamente,
// ya que son declaraciones globales de tipo .d.ts que TypeScript detectará automáticamente)
// Sin embargo, esta línea sirve como documentación para indicar que existen estos tipos
import './testing.d';
