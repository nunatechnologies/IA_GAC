export interface Thread {
  id: string;                   // Identificador único del hilo
  object: string;               // Tipo de objeto o descripción breve del hilo
  created_at: Date;             // Fecha y hora de creación del hilo
  metadata: Record<string, any>; // Metadatos asociados al hilo, como un objeto de clave-valor
  tool_resources: any[];        // Recursos asociados al hilo, podría ser un array de objetos específicos        // Lista de mensajes dentro del hilo
}

  