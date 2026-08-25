import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { DomainError } from './errors';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof DomainError) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'RESOURCE_NOT_FOUND';
        message = 'The requested resource was not found';
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_RESOURCE';
        message = 'A resource with the same unique value already exists';
      } else {
        status = HttpStatus.BAD_REQUEST;
        code = exception.code;
        message = 'The database operation could not be completed';
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') message = payload;
      else if (payload && typeof payload === 'object') {
        const body = payload as { message?: string | string[]; error?: string };
        code = body.error ? normalizeHttpErrorCode(body.error) : `HTTP_${status}`;
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
        details = Array.isArray(body.message) ? body.message : undefined;
      }
    } else if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      data: null,
      error: { code, message, ...(details ? { details } : {}) },
      meta: { requestId: request.id },
    });
  }
}

function normalizeHttpErrorCode(error: string) {
  return error
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toUpperCase();
}
