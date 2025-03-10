import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// import { AllExceptionsFilter } from './filters/all-exceptions.filter';

dotenv.config();
import { WhatsappService } from './whatsapp/whatssap.service';
// import { LoggingService } from './logging/logging.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors();
  const port = process.env.PORT || 3000;

  // const loggingService = app.get(LoggingService);
  // app.useLogger(loggingService.getLogger());

  await app.listen(port);

  //  app.enableCors({
  //   origin: 'https://crmcanzza.nuna.tech/*',  // O usa una lista segura de dominios en producción
  //   methods: ['GET', 'POST', 'DELETE', 'PUT'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  //   credentials: true,
  // });

  app.enableCors({
    origin: ['http://localhost:5173', 'https://crmcanzza.nuna.tech'], // Permitir ambos entornos
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Permite cookies y tokens
  });
  // const whatsappService = app.get(WhatsappService);
  // await whatsappService.connectAllSessions();

}
bootstrap();
