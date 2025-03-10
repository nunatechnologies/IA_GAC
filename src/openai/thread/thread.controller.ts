import { MessageDto } from './dto/message.dto';
import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { MessageService } from './message/message.service';
import { Thread } from '../thread/interfaces/thread.interface';


@Controller('openai/thread')
export class ThreadController {
  
    constructor(
      private readonly threadService: ThreadService,
      private readonly messageService: MessageService
    ) {}

    @Post('create-thread')
    async createThread(): Promise<Thread> {
        return this.threadService.createThread();
    }

    @Post('send-message')
    async sendMessage(@Body() messageDto:MessageDto){
      const messageResponse = await this.messageService.addMessage(messageDto.threadId,messageDto.message);
      console.log('User: ',messageResponse);
      const lastMessage = await this.messageService.getLastMessage(messageDto.assistantId,messageDto.threadId) ;
      return lastMessage;
    }

    @Get(':threadId/runs/canceled-in-progress')
    async canceledThreadInProgress(@Param('threadId') threadId: string) {
        const canceled = await this.threadService.cancelAllActiveRuns(threadId);
        return { canceled };
    }

    @Get(':threadId/status')
    async getRunStatus(@Param('threadId') threadId: string) {
        const threadStatus = await this.messageService.getThreadStatus(threadId);
        return { threadStatus };
    }



}