import { Injectable, forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { Client, MessageMedia } from 'whatsapp-web.js'; // Asegúrate de tener la librería instalada
import { ThreadService } from 'src/openai/thread/thread.service';
import { WhatssapGateway } from './whatssap.gateway';
import { WWebConfig } from 'src/config/wweb.config';
import { CrmService } from 'src/crm/crm.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';

@Injectable()
export class WhatsappService {
  private clients: Map<string, Client> = new Map();

  constructor(
    private readonly whatssapGateway: WhatssapGateway,
    @Inject(forwardRef(() => ThreadService))
    private readonly threadService: ThreadService,
    private readonly crmService: CrmService,
    

  ) { }

  async initializeClient(clientId: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      const qrCallback = (qr: string) => {
        this.whatssapGateway.emitQrCode(clientId, qr);
        resolve(qr); // Resuelve la promesa con el código QR
      };
      const messageCallback = async (msg: any) => {
        try {
          let message;
          if (msg.hasMedia && msg.type === 'ptt') {
            message = await this.handleAudioMessage(clientId, msg);
            msg.body = message;
          }
          if (!msg.body || msg.body.trim() === "") {
            console.log(`Mensaje vacío recibido para el cliente ${msg.from}, ignorando...`);
            return;
          }
          console.log('Procesando el mensaje...');
          
          await this.handleMessage(clientId, msg);
          console.log('Mensaje procesado exitosamente');
        } catch (error) {
          console.error(`Error al procesar el mensaje para el cliente ${clientId}:`, error);
          await this.reconnectClient(clientId);
        }
      };
      const readyCallback = async () => {
        console.log(`Cliente ${clientId} está listo`);
        this.whatssapGateway.readyClient(clientId);
      };
      const disconnectCallback = async () => {
        console.log(`Cliente ${clientId} se desconectó`);
        this.disconnectClient(clientId);
      }

      try {
        const client = await WWebConfig.getInstance(clientId, qrCallback, messageCallback, readyCallback, disconnectCallback);
        this.clients.set(clientId, client);
      } catch (error) {
        console.error(`Error al inicializar el cliente ${clientId}:`, error);
        
        reject(error);
      }
    });
  }

  async connectAllSessions() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Obtener las colecciones de MongoDB
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Filtrar colecciones relacionadas con RemoteAuth de WhatsApp
    const whatsappCollections = collections.filter(collection =>
      collection.name.startsWith('whatsapp-RemoteAuth') && collection.name.endsWith('.files')
    );

    console.log(`Se encontraron ${whatsappCollections.length} colecciones de WhatsApp.`);

    if (whatsappCollections.length > 0) {
      // Aquí recorremos todas las colecciones para reconectar a todos los clientes
      for (const collection of whatsappCollections) {
        const clientId = collection.name.replace('whatsapp-RemoteAuth-', '').replace('.files', '');
        console.log(`Intentando reconectar cliente: ${clientId}`);
        try {
          const qr = await this.initializeClient(clientId);
          console.log(`Cliente ${clientId} reconectado exitosamente: ${qr}`);
        } catch (error) {
          console.error(`Error al reconectar cliente ${clientId}:`, error);
        }
      }
    } else {
      console.log('No se encontraron colecciones de WhatsApp para reconectar.');
    }

    return true;
  }

  async connectAllSessionsActives() {
    const sessionsPath = path.resolve(process.cwd(), '../data-sessions');
    if (!fs.existsSync(sessionsPath)) {
      console.log('No se encontró el directorio de sesiones locales.');
      return;
    }

    const sessionDirectories = fs.readdirSync(sessionsPath);

    const clientIds = sessionDirectories
      .filter((dir) => dir.startsWith('session-')) // Filtrar los directorios que comienzan con "session-"
      .map((dir) => dir.replace('session-', '')); // Extraer el ID del cliente

      console.log(`Se encontraron ${clientIds.length} sesiones activas.`);


    if (clientIds.length > 0) {
      // Aquí recorremos todas las colecciones para reconectar a todos los clientes
      for (const clientId of clientIds) {
        console.log(`Intentando reconectar cliente: ${clientId}`);
        try {
          const qr = await this.initializeClient(clientId);
          console.log(`Cliente ${clientId} reconectado exitosamente.`);
        } catch (error) {
          console.error(`Error al reconectar cliente ${clientId}:`, error);
        }
      }
    } else {
      console.log('No se encontraron colecciones de WhatsApp para reconectar.');
    }

    return true;
  }


  async reconnectClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        await new Promise(resolve => setTimeout(resolve, 8000));
        await client.initialize();
        console.log(`Cliente ${clientId} reiniciado con éxito.`);
      } catch (error) {
        console.error(`Error al reiniciar el cliente ${clientId}:`, error);
      }
    } else {
      console.error(`Cliente ${clientId} no encontrado para reiniciar.`);
    }
  }


  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }
  async sendMessage(clientId: string, to: string, message: string): Promise<void> {
    const client = this.clients.get(clientId);
    console.log('enviar mensaje a:', to, message, 'Desde :', clientId);
    if (client) {
      await client.sendMessage(to, message);
      console.log('Se Envio un mensaje a whatssap de ', to);
    } else {
      throw new Error(`Client ${clientId} not found`);
    }
  }
  async sendPDF(clientId: string, to: string): Promise<void> {
    console.log('antes de enviar file', clientId, to);
    const client = this.clients.get(clientId);
    const media = await MessageMedia.fromUrl('https://canzza.com.bo/wp-content/uploads/2024/10/pora-oficial-brochure-v1.pdf',
      { unsafeMime: true });
    await client.sendMessage(to, media, { caption: 'FLYER DE PORA' });
  }
  async getClientStatus(clientId: string): Promise<any> {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    return true;
  }
  async disconnectClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }
    await client.logout();
    this.clients.delete(clientId);
  }
  async handleMessage(clientId: string, msg: any) {
    //this.whatssapGateway.emitMessage(clientId, msg);
    const phoneWithCode = msg.id.remote;
    const phoneNumber = phoneWithCode.split('@')[0];
    const { data: conversation } = await this.crmService.getConversationByPhone(phoneNumber);
    if (conversation && Object.keys(conversation).length > 0) {
      if (conversation.ia_status) {
        console.log('Conversacion Encontada');
        const responseAssistand = await this.threadService.respondeAsistant(conversation.thread, {
          threadId: conversation.thread,
          message: msg.body,
          assistantId: process.env.ASSISTANT_ID,
          clientId: clientId,
          from: phoneWithCode,
        });
        // if (responseAssistand.document.brochure == true) {
        //   await this.sendPDF(clientId, phoneWithCode);
        // }
        if (responseAssistand.name != null && conversation.isCustomer == false) {
          console.log('registrando nombre')
          await this.crmService.registerCustomer(responseAssistand.name, phoneNumber, conversation.id, conversation.thread);
        }
        // if (responseAssistand.appointment && responseAssistand.appointment.confirm === true && conversation.opportunity != null) {
        //   await this.crmService.generateVisit(conversation.opportunity, responseAssistand.appointment);
        //   await this.crmService.convertCustomerToProspect(conversation.opportunity);
        // }
      }
    } else {
      console.log('No  Conversacion Encontada');
      const newThread = await this.threadService.createThread();
      await this.crmService.registerConversation(phoneNumber, newThread.id);
      await this.threadService.respondeAsistant(newThread.id, {
        threadId: newThread.id,
        message: msg.body,
        assistantId: process.env.ASSISTANT_ID,
        clientId: clientId,
        from: phoneWithCode,
      });
    }
  }
  async handleAudioMessage(clientId: string, msg: any) {
    const uniqueFileName = `audio_${msg.id.id}_${Date.now()}.ogg`;
    const tempFilePath = path.join(__dirname, uniqueFileName);
    try {
      console.log('Antes de descargar el audio');
      const media = await msg.downloadMedia();
      const audioBuffer = Buffer.from(media.data, 'base64');

      console.log('Antes de guardar');

      await promisify(fs.writeFile)(tempFilePath, audioBuffer);
      console.log('Archivo de audio guardado en', tempFilePath);

      const transcripcion = await this.threadService.transcribeAudio(tempFilePath);
      console.log('traduccion', transcripcion);
      return transcripcion;
    } catch (error) {
      console.error('Error al manejar el mensaje de audio:', error.message);
      throw error;
    } finally {
      promisify(fs.unlink)(tempFilePath)
        .then(() => console.log('Archivo temporal eliminado:', tempFilePath))
        .catch((err) => console.error('Error al eliminar el archivo temporal:', err));
    }
  }
  async getAllChats(clientId: string) {
    const client = this.getClient(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const chats = await client.getChats();
    return chats; // Esto devuelve todos los chats
  }

  async getAllContacts(clientId: string) {
    const client = this.getClient(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const contacts = await client.getContacts();
    return contacts; // Esto devuelve todos los contactos
  }
  async getChat(clientId: string, chatId: string) {
    const client = this.getClient(clientId);
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    return chat; // Retorna el objeto chat
  }

  async getMessagesFromChat(clientId: string, chatId: string) {
    const client = this.getClient(clientId);
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Obtiene todos los mensajes del chat
    const messages = await chat.fetchMessages({ limit: 100 }); // Puedes cambiar el límite según lo necesites
    return messages;
  }
}
