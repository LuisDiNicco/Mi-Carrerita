import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const { method, url } = request;
        // Obtain correlationId from request object appropriately
        const correlationId = (request as unknown as Record<string, unknown>).correlationId || '';
        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = ctx.getResponse<Response>();
                    const delay = Date.now() - start;
                    const cidPrefix = correlationId ? `[${correlationId}] ` : '';
                    this.logger.log(`${cidPrefix}${method} ${url} ${response.statusCode} - ${delay}ms`);
                },
                error: (err) => {
                    const delay = Date.now() - start;
                    const cidPrefix = correlationId ? `[${correlationId}] ` : '';
                    // Let the global filter handle the actual error log, we just log the time it took to fail
                    this.logger.error(`${cidPrefix}${method} ${url} FAILED - ${delay}ms`);
                }
            }),
        );
    }
}
