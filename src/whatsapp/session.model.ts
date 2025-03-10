import { Schema, Document, model } from 'mongoose';

export interface SessionDocument extends Document {
  clientId: string;
  authState: any;
}

const SessionSchema = new Schema({
  clientId: { type: String, required: true, unique: true },
  authState: { type: Object, required: true },
});

export const SessionModel = model<SessionDocument>('Session', SessionSchema);
