import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosResponse } from 'axios';


@Injectable()
export class HttpServiceWrapper {
  constructor(private readonly httpService: HttpService) { }

  private readonly apiUrl = process.env.URL_BACKEND;

  private getFullUrl(endpoint: string): string {
    return `${this.apiUrl}/${endpoint}`;
  }

  async get<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpService.get(this.getFullUrl(endpoint), { params }).toPromise();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpService.post(this.getFullUrl(endpoint), data).toPromise();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpService.put(this.getFullUrl(endpoint), data).toPromise();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpService.patch(this.getFullUrl(endpoint), data).toPromise();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpService.delete(this.getFullUrl(endpoint)).toPromise();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error.response) {
      throw new HttpException(error.response.data.message || 'Internal Server Error', error.response.status);
    } else if (error.request) {
      throw new HttpException('No response received from server', HttpStatus.GATEWAY_TIMEOUT);
    } else {
      throw new HttpException(error.message || 'An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
