/**
 * @fileoverview Sistema de logging estructurado para Cobralon-FB
 * 
 * Proporciona logging profesional con diferentes niveles y formateo.
 * Reemplaza todos los console.logs eliminados con un sistema unificado.
 * 
 * @version 1.0.0
 * @since Enero 2025 - Refactorización híbrida
 */

import winston from 'winston';

// Configuración de niveles de logging
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Colores para diferentes niveles
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Formateo personalizado para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuración de transports según el entorno
const transports: winston.transport[] = [
  // Consola para desarrollo
  new winston.transports.Console({
    format: format,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  }),
];

// En producción, también log a archivo
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Crear instancia del logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  levels,
  transports,
  // No salir en errores no manejados
  exitOnError: false,
});

/**
 * Clase de utilidades de logging para diferentes dominios
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log de información general
   */
  info(message: string, meta?: any): void {
    logger.info(`[${this.context}] ${message}`, meta);
  }

  /**
   * Log de advertencias
   */
  warn(message: string, meta?: any): void {
    logger.warn(`[${this.context}] ${message}`, meta);
  }

  /**
   * Log de errores
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      logger.error(`[${this.context}] ${message}`, {
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.error(`[${this.context}] ${message}`, { error });
    }
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, meta?: any): void {
    logger.debug(`[${this.context}] ${message}`, meta);
  }

  /**
   * Log específico para operaciones de base de datos
   */
  database(operation: string, details?: any): void {
    logger.debug(`[${this.context}] DB: ${operation}`, details);
  }

  /**
   * Log específico para operaciones de autenticación
   */
  auth(action: string, userId?: string): void {
    logger.info(`[${this.context}] AUTH: ${action}`, { userId });
  }

  /**
   * Log específico para operaciones de pago
   */
  payment(action: string, paymentId?: string, amount?: number): void {
    logger.info(`[${this.context}] PAYMENT: ${action}`, { 
      paymentId, 
      amount 
    });
  }
}

// Loggers predefinidos para diferentes módulos
export const projectLogger = new Logger('PROJECT');
export const paymentLogger = new Logger('PAYMENT');
export const clientLogger = new Logger('CLIENT');
export const eventLogger = new Logger('EVENT');
export const authLogger = new Logger('AUTH');

export default logger;