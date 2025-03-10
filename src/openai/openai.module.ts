import { Module } from '@nestjs/common';
import { AssistantModule } from './assistant/assistant.module';
import { ThreadModule } from './thread/thread.module';
import { OpenAIController } from './openai.controller';


@Module({
    imports: [AssistantModule, ThreadModule],
    controllers: [OpenAIController],
})
export class OpenaiModule {}
