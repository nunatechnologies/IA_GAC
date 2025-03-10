import { Controller, Post, Body, Put, Param } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { CreateAssistantDto } from './dto/assistant.dto';

@Controller('openai/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('create-assistant')
  async createAssistant(@Body() createAssistantDto: CreateAssistantDto) {
    return this.assistantService.createAssistant(createAssistantDto);
  }
  @Put('edit-assistant/:id')
  async editAssistant(
    @Param('id') id: string,
    @Body() updateAssistantDto: CreateAssistantDto
  ) {
    return this.assistantService.editAssistant(id, updateAssistantDto);
  }

  @Put('edit-promptInventory/:id')
  async updateInventoryPrompt(
    @Param('id') id: string,
    @Body('inventory') inventory: string,
  ) {
    return this.assistantService.editInventoryInPrompt(id, inventory);
  }

  
}
