import {
  ZodValidationPipe,
  ZodSerializerInterceptor,
  ZodSerializationException,
  ZodValidationException,
} from 'nestjs-zod';
import z, { ZodError } from 'zod';
import {
  Module,
  HttpException,
  ArgumentsHost,
  Logger,
  Catch,
  BadRequestException,
} from '@nestjs/common';
import { NodeModule } from './node/node.module';
import {
  APP_PIPE,
  APP_INTERCEPTOR,
  APP_FILTER,
  BaseExceptionFilter,
} from '@nestjs/core';

@Catch(HttpException)
class HttpExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();

      if (zodError instanceof ZodError) {
        this.logger.error(`ZodSerializationException: ${zodError.message}`);
      }
    }

    super.catch(exception, host);
  }
}

@Module({
  imports: [NodeModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
