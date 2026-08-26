import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ApiResponse } from './errors';
import { serializeBigInts } from './serialization';

export const SKIP_RESPONSE_ENVELOPE = 'skipResponseEnvelope';

export function shouldSkipResponseEnvelope(context: ExecutionContext) {
  return Boolean(
    Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE, context.getHandler()) ||
    Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE, context.getClass()),
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    if (shouldSkipResponseEnvelope(context)) return next.handle() as Observable<ApiResponse<T>>;
    return next.handle().pipe(map((data) => ({ data: serializeBigInts(data), error: null })));
  }
}
