import { Module } from '@nestjs/common';
import { HttpServiceWrapper } from './http.service.wrapper';
import { HttpModule as NestHttpModule } from '@nestjs/axios';

@Module({
  imports: [NestHttpModule],
  providers: [HttpServiceWrapper],
  exports: [HttpServiceWrapper],
})
export class HttpModuleWrapper {}
