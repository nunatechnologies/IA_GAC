import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { OpenAIConfig } from 'src/config/openai.config';
import { CreateAssistantDto } from './dto/assistant.dto';
import { generatePrompt } from './prompts/pora.prompt';


@Injectable()
export class AssistantService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = OpenAIConfig.getInstance();
  }
  async createAssistant(createAssistantDto: CreateAssistantDto) {
    const assistant = await this.openai.beta.assistants.create(createAssistantDto);
    return { ...createAssistantDto, assistant: assistant };
  }
  async editAssistant(id: string, updateAssistantDto: CreateAssistantDto) {
    const updatedAssistant = await this.openai.beta.assistants.update(id, updateAssistantDto);
    return { id, ...updateAssistantDto, assistant: updatedAssistant };
  }
  async editPrompt(id: string, newPrompt: string) {
    const updatedPrompt = await this.openai.beta.assistants.update(id, { instructions: newPrompt });
    return { id, prompt: newPrompt, assistant: updatedPrompt };
  }
  async editInventoryInPrompt(id: string, inventory: string) {
    const updatedInstructions = generatePrompt(inventory);   
    const updatedAssistant = await this.openai.beta.assistants.update(id, { instructions: updatedInstructions });
    return { id, inventory, assistant: updatedAssistant };
  }
}
