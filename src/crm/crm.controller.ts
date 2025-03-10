import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('crm')
export class CrmController {
    constructor(private readonly crmService: CrmService) {}
    @Get('conversation/:phone')
    async getConversationByPhone(@Param('phone') phone: string) {
        return this.crmService.getConversationByPhone(phone);
    }
    @Post('register-customer')
    async registerCustomer(@Body() customer: { name: string; phone: string }) {
        return this.crmService.registerCustomer(customer.name, customer.phone,null,null);
    }
}
