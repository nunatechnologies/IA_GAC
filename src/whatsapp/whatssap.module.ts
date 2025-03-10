import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatssap.service';
import { WhatssapGateway } from './whatssap.gateway';
import { WhatssapController } from './whatssap.controller';
import { CrmService } from 'src/crm/crm.service';
import { HttpServiceWrapper } from 'src/http/http.service.wrapper';
import { HttpModule } from '@nestjs/axios';
import { ThreadModule } from 'src/openai/thread/thread.module';


@Module({
  imports: [HttpModule,forwardRef(() => ThreadModule)],
  controllers: [WhatssapController],
  providers: [WhatssapGateway,WhatsappService,CrmService,HttpServiceWrapper],
  exports: [WhatsappService],
})
export class WhatsappModule {}
