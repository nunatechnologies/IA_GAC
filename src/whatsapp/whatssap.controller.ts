import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { WhatsappService } from './whatssap.service';

@Controller('whatssap')
export class WhatssapController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Post('initialize')
  async initializeClient(@Body('clientId') clientId: string) {
    const qr = await this.whatsappService.initializeClient(clientId);
    return { status: 'Client initialized', qr };
  }
  @Get('reconnectAllSessions')
  async reConnectClients() {
    await this.whatsappService.connectAllSessions();
    return { message: 'Todos los Clientes estan siendo Inicializado',status: true };
  }
  @Post('send-message')
  async sendMessage(@Body() body: { to: string; message: string, clientId: string }) {
    const { to, message, clientId } = body;
    await this.whatsappService.sendMessage(clientId, to, message);
    return { status: 'Message sent' };
  }
  @Get('status/:clientId')
  async getClientStatus(@Param('clientId') clientId: string) {
    const status = await this.whatsappService.getClientStatus(clientId);
    return { status: status };
  }
  @Delete('disconnect/:clientId')
  async disconnectClient(@Param('clientId') clientId: string) {
    await this.whatsappService.disconnectClient(clientId);
    return { status: 'Client disconnected' };
  }
  @Get('chats/:clientId')
  async getAllChats(@Param('clientId') clientId: string) {
    const chats = await this.whatsappService.getAllChats(clientId);
    return { chats };
  }
  @Get('contacts/:clientId')
  async getAllContacts(@Param('clientId') clientId: string) {
    const contacts = await this.whatsappService.getAllContacts(clientId);
    return { contacts };
  }

  @Get('messages/:clientId/:chatId')
  async getMessagesFromChat(@Param('clientId') clientId: string, @Param('chatId') chatId: string) {
      const messages = await this.whatsappService.getMessagesFromChat(clientId, chatId);
      const msgGroupMap = new Map<string, { senderId: string, messages: any[] }>();
  
      // Ordenar los mensajes por timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
  
      messages.forEach(msg => {
          const senderId = msg.from; // Asumiendo que `msg.from` contiene el ID del remitente
  
          // Si el remitente no está en el mapa, agregarlo
          if (!msgGroupMap.has(senderId)) {
              msgGroupMap.set(senderId, { senderId, messages: [] });
          }
  
          // Agregar el mensaje al grupo correspondiente
          msgGroupMap.get(senderId)?.messages.push({
              body: msg.body,
              timestamp: msg.timestamp,
              type: msg.type,
              fromMe: msg.fromMe,
          });
      });
  
      const msgGroups = Array.from(msgGroupMap.values());
  
      return { messages: msgGroups };
  }

//   @Get('messages/:clientId/:chatId')
// async getMessagesFromChat(@Param('clientId') clientId: string, @Param('chatId') chatId: string) {
//     const messages = await this.whatsappService.getMessagesFromChat(clientId, chatId);
    
//     // Ordenar los mensajes por timestamp
//     messages.sort((a, b) => a.timestamp - b.timestamp);

//     // Transformar los mensajes al formato requerido
//     const formattedMessages = messages.map(msg => ({
//         message: msg.body, // Cambiamos `body` por `message`
//         time: new Date(msg.timestamp).toString(), // Convertir timestamp a formato de fecha
//         senderId: msg.from, // Asumimos que `msg.from` es el ID del remitente
//         feedback: {
//             isSent: msg.fromMe, // Si fue enviado por el usuario
//             isDelivered: true, // Suponiendo que está siempre entregado
//             isSeen: true, // Suponiendo que está siempre visto
//         },
//     }));

//     return { messages: formattedMessages };
// }

  
  @Get('chat/:clientId/:chatId')
  async getChatInfo(@Param('clientId') clientId: string, @Param('chatId') chatId: string) {
    const chat = await this.whatsappService.getChat(clientId, chatId);
    return { chat };
  }

}