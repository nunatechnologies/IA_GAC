import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// import { AllExceptionsFilter } from './filters/all-exceptions.filter';

dotenv.config();
import { WhatsappService } from './whatsapp/whatssap.service';
// import { LoggingService } from './logging/logging.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // const whatsappService = app.get(WhatsappService);
  // await whatsappService.connectAllSessions();

}
bootstrap();
