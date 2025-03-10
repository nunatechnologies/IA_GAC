import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { OpenAIConfig } from 'src/config/openai.config';

@Injectable()
export class MessageService {
    private readonly openai: OpenAI;

    constructor() {
        this.openai = OpenAIConfig.getInstance();
    }

    async addMessage(threadId: string, message: string) {
        try {
            const currentDateTimeLaPaz = new Date().toLocaleString('es-ES', {
                timeZone: 'America/La_Paz',
                hour12: false,
            });
            const messageWithDateTime = `${message}\n\n(Fecha y hora actual: ${currentDateTimeLaPaz})`;

            const messageResponse = await this.openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: messageWithDateTime,
            });
            return messageResponse;
        } catch (error) {
            console.error('No se pudo agregar el mensaje:');
            
            // Verifica el tipo de error y maneja el error específico
            if (error && error.status === 400 && error.error.message.includes("Can't add messages to")) {
                const errorMessage = error.error.message;
                const runIdMatch = errorMessage.match(/run_(\w+)/);
                
                
                if (runIdMatch) {
                    const runId = runIdMatch[0];
                    console.log('run mandando: ',runId,' este es el otro ', runIdMatch);
                    const canceled = await this.cancelActiveRun(threadId, runId);
                    if (canceled==true) {
                        return this.addMessage(threadId, message);
                    }
                }
            }
            
            // Re-lanza el error si no se puede manejar
            return null;
        }
    }

    async getLastMessage(assistantId: string, threadId: string) {
        try {
            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId,
            });

            while (true) {
                const runInfo = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
                if (runInfo.status === "completed") {
                    break;
                }
                if (runInfo.status === "cancelled") {
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const messages = await this.openai.beta.threads.messages.list(threadId);
            const lastMessage = messages.data[0].content[0];
            let jsonResponse = null;
            if (lastMessage && lastMessage.type === 'text') {
                console.log('es el ultimo mensaje:',lastMessage.text.value);
                jsonResponse = JSON.parse(lastMessage.text.value);
            }

            return jsonResponse;
        } catch (error) {
            console.error('No se pudo obtener el último mensaje:', error);
            return null;
        }
    }

    async getThreadStatus(threadId: string) {
        try {
            const threadStatus = await this.openai.beta.threads.retrieve(threadId);
            return threadStatus;
        } catch (error) {
            console.error('No se pudo obtener el estado del hilo:', error);
            throw error;
        }
    }

    async cancelActiveRun(threadId: string, runId: string) {
        try {
        // Intentar cancelar el run
        const cancelResponse = await this.openai.beta.threads.runs.cancel(threadId, runId);

        // Verificar si la cancelación fue exitosa, por ejemplo, si cancelResponse tiene un status específico
        if (cancelResponse.status === "cancelled") {
            return true; 
        } else {
            console.warn('El run no pudo ser cancelado correctamente.');
            return false;
        }
        } catch (error) {
            if (error && error.status === 400 && error.error.message.includes("Cannot cancel run with status")) {
                console.log("No se puede cancelar el run ya que su estado no permite la cancelación.");
                return true;
            }
            return false;
        }
    }
}
