import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  EntityNotFoundError,
  InvalidInputError,
  ConflictError,
  BusinessRuleViolationError,
} from '../errors/domain-errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof DomainError) {
      message = exception.message;
      if (exception instanceof EntityNotFoundError) status = HttpStatus.NOT_FOUND;
      else if (exception instanceof InvalidInputError) status = HttpStatus.BAD_REQUEST;
      else if (exception instanceof ConflictError) status = HttpStatus.CONFLICT;
      else if (exception instanceof BusinessRuleViolationError) status = HttpStatus.UNPROCESSABLE_ENTITY;
      else status = HttpStatus.BAD_REQUEST;
    }

    // No loguear 401 y 404 como errores críticos para evitar ruido en los logs.
    const isExpectedError = status === HttpStatus.UNAUTHORIZED || status === HttpStatus.NOT_FOUND;
    const logMethod = isExpectedError ? 'debug' : 'error';

    this.logger[logMethod](
      `Respuesta ${status} en ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
