import { CrmService } from 'src/crm/crm.service';
import { WhatsappService } from './../../whatsapp/whatssap.service';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { OpenAI } from 'openai';
import { Thread } from '../thread/interfaces/thread.interface';
import { OpenAIConfig } from 'src/config/openai.config';
import { MessageDto } from './dto/message.dto';
import { MessageService } from './message/message.service';
import * as fs from 'fs';

@Injectable()
export class ThreadService {
  private readonly openai: OpenAI;
  private readonly messageQueues: Map<string, MessageDto[]> = new Map();
  private readonly processingThreads: Set<string> = new Set();

  constructor(
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly crmService: CrmService,
  ) {
    this.openai = OpenAIConfig.getInstance();

  }

  async createThread(): Promise<Thread> {
    const openaiThread = await this.openai.beta.threads.create();
    return {
      id: openaiThread.id,
      object: openaiThread.object,
      created_at: new Date(openaiThread.created_at),
      metadata: openaiThread.metadata || {},
      tool_resources: openaiThread.tool_resources || [],
      messages: [],
    } as Thread;
  }

  async cancelAllActiveRuns(threadId: string): Promise<boolean> {
    const { data: runs } = await this.openai.beta.threads.runs.list(threadId);
    const activeRuns = runs.filter(run => run.status === 'in_progress');
    if(activeRuns.length > 0){
      for (const run of activeRuns) {
        console.log(`Cancelando run con id ${run.id}`);
        await this.openai.beta.threads.runs.cancel(threadId, run.id);
      }
      return true;
    }
    return false;
  }

  // async respondeAsistant(threadId: string, messageDto: MessageDto) {
  //   await this.messageService.addMessage(messageDto.threadId, messageDto.message);
  //   const lastMessage = await this.messageService.getLastMessage(messageDto.assistantId, threadId);
  //   // if(lastMessage){
  //   //   await this.whatsappService.sendMessage(messageDto.clientId, messageDto.from, lastMessage.message);
  //   // }
  //   return lastMessage;
  // }

  async respondeAsistant(threadId: string, messageDto: MessageDto) {
    try {
        // Verificar si el hilo existe
        await this.openai.beta.threads.retrieve(threadId);
    } catch (error) {
        if (error.status === 404) {
            // Si el hilo no existe, crear uno nuevo
            console.log('Hilo no encontrado. Creando un nuevo hilo...');
            const newThread = await this.openai.beta.threads.create();
            const thread = {
              id: newThread.id,
              object: newThread.object,
              created_at: new Date(newThread.created_at),
              metadata: newThread.metadata || {},
              tool_resources: newThread.tool_resources || [],
              messages: [],
            } as Thread;
            threadId = thread.id; // Actualizar el threadId
            console.log(`el nuevo id del hilo ${thread.id}`);
            const phoneNumber = messageDto.from.split('@')[0];
            await this.crmService.updateConversation(phoneNumber, thread.id); // Actualizar en el CRM
        } else {
            throw error;
        }
    }

    // Continuar con el procesamiento del mensaje
    await this.messageService.addMessage(threadId, messageDto.message);
    const lastMessage = await this.messageService.getLastMessage(messageDto.assistantId, threadId);
    if(lastMessage){
      await this.whatsappService.sendMessage(messageDto.clientId, messageDto.from, lastMessage.message);
    }
    return lastMessage;
}


  async transcribeAudio(filePath) {
    const transcription = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });
    console.log('Transcripcion: ',transcription.text);
    return transcription.text;
  }
}
