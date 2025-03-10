import { Injectable } from '@nestjs/common';
import { HttpServiceWrapper } from 'src/http/http.service.wrapper';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable()
export class CrmService {
    constructor(private readonly httpService: HttpServiceWrapper) {}
    async getConversationByPhone(phone: string): Promise<any> {
        const endpoint = `conversation/get-conversation-phone/${phone}`;
        const response = await this.httpService.get(endpoint);
        return response;
    }
    async registerConversation(phone,thread){
      console.log('Se acaba de registrar una conversacion');
      const endpoint = 'conversation/register';
      const response = await this.httpService.post(endpoint, {phone,thread});
      return response;
    }
    async updateConversation(phone,thread){
      console.log('Se acaba de registrar una conversacion');
      const endpoint = `conversation/update/${phone}/${thread}`;
      console.log(endpoint);
      const response = await this.httpService.patch(endpoint);
      console.log(response);
      return response;
    }
    async registerCustomer(name,phone,conversationId,thread){
      const phoneNumber = parsePhoneNumberFromString('+'+phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error('Número de teléfono inválido');
      }
      const countryCode = phoneNumber.countryCallingCode;
      const nationalNumber = phoneNumber.nationalNumber;
      const endpoint = 'customer/register';
      console.log(countryCode,nationalNumber);
      const response = await this.httpService.post(endpoint, {name:name,phone:nationalNumber,cod_phone:countryCode,thread:thread,conversation_id: conversationId});
      return response;
    }
    async getCustomerByPhone(phone: string, countryCode: string){
      const endpoint = `customer/get-customer-phone`
      const response = await this.httpService.get(`${endpoint}?phone=${phone}&country_code=${countryCode}`);
      return response;
    }
    async convertCustomerToProspect(opportunityId){
      const endpoint = `opportunity/convert-prospect/${opportunityId}`;
      const response = await this.httpService.patch(endpoint, {opportunity_id: opportunityId});
      return response;
    }
    async generateVisit(opportunityId,visit){
      console.log('Visita : ',visit , opportunityId);
      const endpontVisit = `activity`;
      const now = new Date();
      const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const responseVisit = await this.httpService.post(endpontVisit, {
        opportunity_id: opportunityId,
        title: visit.title,
        description: visit.description,
        type_activity_id: 1, //TODO : ESTE TIPÓ ES UNA VISITA INTENCION
        scheduled_at: formattedDateTime,
        });
        return responseVisit;
    }
}
