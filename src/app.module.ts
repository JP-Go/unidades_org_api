import { Module } from '@nestjs/common';
import { NodeModule } from './node/node.module';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nest-lab/typeschema';

@Module({
  imports: [NodeModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
