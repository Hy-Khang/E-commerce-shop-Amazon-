import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorBody: any = {
      success: false,
      error: {
        code: exceptionResponse.code || 'COMMON_002',
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse.message || exception.message,
      },
    };

    if (exceptionResponse.details) {
      errorBody.error.details = exceptionResponse.details;
    }

    this.logger.error(
      `${status} — ${errorBody.error.code}: ${errorBody.error.message}`,
    );
    response.status(status).json(errorBody);
  }
}
