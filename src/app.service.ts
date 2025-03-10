import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging/logging.service';// Asegúrate de que la ruta sea correcta

@Injectable()
export class AppService {
  constructor(private readonly loggingService: LoggingService) {}

  getHello(): string {
    // Este log solo se guardará en el archivo, sin mostrarse en consola
    console.log('Este es un mensaje de prueba que se guardará en el archivo pero no en la consola');
    return 'Hello World!';
  }
}
