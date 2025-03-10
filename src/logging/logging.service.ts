import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file'; // Para manejar archivos de log diarios

@Injectable()
export class LoggingService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'debug', // Todos los logs desde 'debug' hacia arriba
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Incluye la fecha y hora
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
      transports: [
        // Guardar los logs en archivos, sin mostrarlos en consola
        new winston.transports.DailyRotateFile({
          filename: '../logsIA/%DATE%-combined.log', // Los logs se guardarán en este archivo
          datePattern: 'YYYY-MM-DD', // Formato de la fecha en el nombre del archivo
          level: 'debug', // Guardamos logs desde 'debug'
          maxFiles: '14d', // Limitar los archivos a 14 días
        }),
      ],
    });

    // Redirigir console.log para que también guarde en el archivo, pero no lo muestre en consola
    this.overrideConsoleLog();
  }

  // Redirige console.log para que registre en Winston pero sin imprimir en consola
  private overrideConsoleLog(): void {
    // Guardar los logs en el archivo, pero no mostrarlos en la consola
    const originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      // Usamos el logger para guardar los logs en el archivo
      this.logger.info(args.join(' ')); // Guardamos el mensaje de log
      originalConsoleLog(...args); // También lo mostramos en la consola como normalmente
    };
  }

  // Método para obtener el logger
  getLogger(): winston.Logger {
    return this.logger;
  }
}
