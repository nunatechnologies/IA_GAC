import { HttpModule, HttpService } from '@nestjs/axios';
import { Module, Global } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

export const apiClientConfig: AxiosRequestConfig = {
  baseURL: process.env.URL_BACKEND, 
};

@Global()
@Module({
  imports: [
    HttpModule.register(apiClientConfig),
  ],
  providers: [
    {
      provide: 'API_SERVICE',
      useFactory: (httpService: HttpService) => {
        return {
          get: (endpoint: string) => 
            httpService.get(endpoint).toPromise().then(response => response.data),
          post: (endpoint: string, data: any) => 
            httpService.post(endpoint, data).toPromise().then(response => response.data),
          put: (endpoint: string, data: any) => 
            httpService.put(endpoint, data).toPromise().then(response => response.data),
          delete: (endpoint: string) => 
            httpService.delete(endpoint).toPromise().then(response => response.data),
        };
      },
      inject: [HttpService],
    },
  ],
  exports: ['API_SERVICE'],
})
export class ApiClientConfigModule {}
