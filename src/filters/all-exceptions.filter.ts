import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    const errorMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Registrar excepción en Winston
    this.logger.error({
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
    });

    // Respuesta al cliente
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}
