import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: true }) // Habilitar CORS si es necesario
@Injectable()
export class WhatssapGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  afterInit() {
    console.log('Socket server initialized');
  }

  // Notificar que el cliente está listo
  readyClient(clientId: string) {
    this.server.emit(`ready-${clientId}`, { status: 'ready' });
    console.log(`Cliente ${clientId} listo`);
  }

  // Emitir el código QR al cliente específico
  emitQrCode(clientId: string, qr: string) {
    console.log('Cliente Inicializado:', clientId);
    this.server.emit(`qr-whatssap-${clientId}`, qr);
  }

  // Emitir mensajes específicos para el cliente
  async emitMessage(clientId: string, msg: any) {
    console.log('Emitiendo mensaje para el cliente:', clientId);
    this.server.emit(`message-${clientId}`, { msg: msg.body });
  }
}
