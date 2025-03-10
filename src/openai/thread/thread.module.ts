import { CrmService } from 'src/crm/crm.service';
import { Module, forwardRef } from '@nestjs/common';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';
import { MessageService } from './message/message.service';
import { OpenAIConfig } from 'src/config/openai.config';
import { WhatsappModule } from 'src/whatsapp/whatssap.module';
import { HttpServiceWrapper } from 'src/http/http.service.wrapper';
import { HttpModule } from '@nestjs/axios';

@Module({  
    imports: [HttpModule, forwardRef(() => WhatsappModule)],
    controllers: [ThreadController],
    providers: [ThreadService,MessageService,CrmService, HttpServiceWrapper, OpenAIConfig],
    exports: [ThreadService],
})
export class ThreadModule {}
