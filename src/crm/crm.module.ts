import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { HttpModuleWrapper } from 'src/http/http.module';

@Module({
  imports: [HttpModuleWrapper],
  providers: [CrmService],
  controllers: [CrmController],
})
export class CrmModule {}
