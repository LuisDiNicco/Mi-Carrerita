import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const id = (req.headers['x-correlation-id'] as string) || randomUUID(); // Attach to request object for logging or downstream use
        (req as unknown as Record<string, unknown>).correlationId = id;
        res.setHeader('X-Correlation-Id', id);
        next();
    }
}
