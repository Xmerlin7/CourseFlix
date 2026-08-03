import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import {
    CORRELATION_ID_HEADER,
    runWithCorrelationId,
} from './correlation.context';

export function correlationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const incoming = req.header(CORRELATION_ID_HEADER);
    const correlationId = incoming && incoming.trim() ? incoming : randomUUID();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    runWithCorrelationId(correlationId, next);
}