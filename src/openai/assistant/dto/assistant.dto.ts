export class CreateAssistantDto {
    readonly name: string;
    readonly model: string;
    readonly description?: string; 
    readonly instructions?: string; 
    readonly max_tokens: 1000; 

}