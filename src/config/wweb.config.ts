import { Client, LocalAuth, RemoteAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode-terminal';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';
import * as path from 'path';


export class WWebConfig {
  private static instances = new Map<string, Client>();
  private static qrCallbacks = new Map<string, (qr: string) => void>();
  private static readyCallbacks = new Map<string, () => void>();
  private static recentMessages: Set<string> = new Set();
  private static messageQueues = new Map<string, Array<any>>();
  private static activeChats = new Map<string, boolean>();
  private static qrTimeouts = new Map<string, NodeJS.Timeout>();


  static async getInstance(clientId: string, qrCallback?: (qr: string) => void, messageCallback?: (msg: any) => void, readyCallback?: () => void, disconnectCallback?: () => void): Promise<Client> {
    if (this.instances.has(clientId)) {
      console.log('Ya existe esta Instancia:',clientId);
      return this.instances.get(clientId);
    }
    try {
      //Conexion a Mongo
      await mongoose.connect(process.env.MONGODB_URI);
      //Crear Cliente de Whatssap
      const client = new Client({
        authStrategy: new RemoteAuth({
          clientId,
          // dataPath: path.resolve(process.cwd(), '../data-sessions'),
          store: new MongoStore({ mongoose }),
          backupSyncIntervalMs: 300000
        }),
        webVersion: '2.2445.7.0',
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2445.7.0.html'
        },
        puppeteer: {
          headless: true,
          // userDataDir: path.resolve(process.cwd(), '../data-sessions', `RemoteAuth-${clientId}`),
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--no-zygote'],
          defaultViewport: { width: 800, height: 600 },
          timeout: 60000,
        },
      });
      //Configurar Eeventos de Whatssap
      client.on('error', (error) => {
        console.error(`Error en cliente ${clientId}:`, error);
      });
      client.on('qr', (qr) => {
        console.log('Se Emitio un Nuevo QR');
        this.handleQr(clientId, client, qr, qrCallback)
      });
      client.on('ready', async () => {
        const browser = client.pupBrowser; // Acceder al navegador Puppeteer
        if (browser) {
          const pages = await browser.pages(); // Obtener todas las páginas abiertas
          console.log(`El navegador tiene ${pages.length} páginas abiertas.`);
        }
  
        this.handleReady(clientId, readyCallback);

      });
      client.on('auth_failure', (msg) => this.handleAuthFailure(clientId, msg));
      client.on('disconnected', (reason) => this.handleDisconnect(clientId, reason, disconnectCallback));
      client.on('change_state', state => {
        console.log('Connection state changed to:', state);
      });
      client.on('message', async (msg) => {
        if (msg.from.endsWith('@c.us')) {
          console.log(`MENSAJE RECIBIDO para el cliente ${clientId}, número: ${msg.from}, El mensaje es: ${msg.body}`);
          // Crear un identificador único para cada mensaje usando el ID del mensaje y el número de cliente
          const uniqueMessageId = `${msg.from}_${msg.id.id}`;

          // Verificar si el mensaje ya fue recibido (duplicado)
          if (this.recentMessages.has(uniqueMessageId)) {
            console.log(`Mensaje duplicado de ${msg.from}, ignorando.`);
            return; // Ignoramos el mensaje duplicado
          }

          // Añadir el identificador único al conjunto de mensajes recientes
          this.recentMessages.add(uniqueMessageId);

          // Limpiar mensajes antiguos después de cierto tiempo para evitar que crezca indefinidamente
          setTimeout(() => {
            this.recentMessages.delete(uniqueMessageId);
          }, 60000);

          // Verificar si el número está en los contactos y tiene un nombre asignado
          const contacts = await client.getContacts();
          const contact = contacts.find(contact => contact.id._serialized === msg.from);

          if (contact && contact.isMyContact) {
            const nameToShow = contact.name || contact.pushname || 'Sin nombre';
            console.log(`El número ${msg.from} está en tus contactos con el nombre ${nameToShow}. No responderé.`);
            return;
          }

          // Si la cola del cliente no existe, la creamos
          if (!this.messageQueues.has(msg.from)) {
            this.messageQueues.set(msg.from, []);
          }

          // Añadir el mensaje a la cola
          this.messageQueues.get(msg.from).push(msg);

          // Si ya hay un proceso en curso, no hacemos nada más
          if (this.activeChats.get(msg.from)) {
            console.log(`Ya hay un proceso en curso para el número ${msg.from}. Añadiendo mensaje a la cola.`);
            return;
          }

          // Procesar la cola de mensajes de este cliente
          this.processMessageQueue(msg.from, messageCallback);
        }
      });
      client.on('remote_session_saved', () => {
        console.log(`La sesión remota para el cliente ha sido guardada.`);
      });
      //Inicializar Cliente
      try {
        client.initialize();
      } catch (error) {
        console.error(`Error al inicializar cliente ${clientId}:`, error);
        throw new Error('No se pudo inicializar el cliente de WhatsApp.');
      }
      this.instances.set(clientId, client);
      return client;
    } catch (error) {
      console.error(`Error general al obtener instancia para cliente ${clientId}:`, error);
      throw error;
    }
  }

  private static handleQr(clientId: string, client: Client, qr: string, qrCallback?: (qr: string) => void) {
    qrCallback(qr);
    //this.setQrTimeout(clientId, client);
  }

  private static handleReady(clientId: string, readyCallback?: () => void) {
    console.log(`Client ${clientId} is ready!`);
    readyCallback?.();
    //this.clearQrTimeout(clientId);
  }

  private static handleAuthFailure(clientId: string, msg: string) {
    console.error(`Authentication failed for client ${clientId}: ${msg}`);
    //this.clearQrTimeout(clientId);
  }

  private static handleDisconnect(clientId: string, reason: string, disconnectCallback?: () => void) {
    console.warn(`Client ${clientId} disconnected: ${reason}`);
    this.instances.delete(clientId);
    disconnectCallback?.();
  }
  private static setQrTimeout(clientId: string, client: Client) {
    this.clearQrTimeout(clientId);

    const timeout = setTimeout(() => {
      console.warn(`No QR scan for client ${clientId}. Disconnecting...`);
      client.logout();
      this.instances.delete(clientId);
    }, 120000);

    this.qrTimeouts.set(clientId, timeout);
  }

  private static clearQrTimeout(clientId: string) {
    console.log('clearQrTimeout');
    const timeout = this.qrTimeouts.get(clientId);
    if (timeout) {
      clearTimeout(timeout);
      this.qrTimeouts.delete(clientId);
    }
  }

  static async processMessageQueue(clientId: string, messageCallback: (msg: any) => void) {
    if (!this.activeChats.get(clientId)) {
      this.activeChats.set(clientId, true);

      while (this.messageQueues.get(clientId)?.length) {
        const msg = this.messageQueues.get(clientId)!.shift();
        try {
          await messageCallback(msg);
        } catch (error) {
          console.error(`Error processing message for client ${clientId}:`, error);
        }
      }

      this.activeChats.set(clientId, false);
    }
  }

  static setQrCallback(clientId: string, callback: (qr: string) => void) {
    this.qrCallbacks.set(clientId, callback);
  }

  static setReadyCallback(clientId: string, callback: () => void) {
    this.readyCallbacks.set(clientId, callback);
  }
}
