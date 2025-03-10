import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatssap.module';
import { OpenaiModule } from './openai/openai.module';
import { CustomerModule } from './customer/customer.module';
import { CrmModule } from './crm/crm.module';
import { HttpModuleWrapper } from './http/http.module';
import { LoggingService } from './logging/logging.service';



@Module({
  imports: [OpenaiModule,WhatsappModule, CustomerModule, CustomerModule, HttpModuleWrapper, CrmModule],
  controllers: [AppController],
  providers: [AppService,LoggingService],
})
export class AppModule {}
