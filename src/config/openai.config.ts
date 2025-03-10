import { OpenAI } from 'openai';

export class OpenAIConfig {
  private static instance: OpenAI;
  static getInstance(): OpenAI {
    if (!this.instance) {
      this.instance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.instance;
  }
}
