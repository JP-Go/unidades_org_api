import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as v from 'valibot';
import { Schema, schema } from './infrastructure/database/schema';
import { dbConfig } from './config/database';
import { UserController } from './infrastructure/api/user.controller';

const DRIZZLE = Symbol('drizzle');

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [dbConfig],
      validationSchema: {
        validate: v.parser(
          v.object({
            DATABASE_URL: v.pipe(v.string(), v.url()),
          }),
          {
            abortEarly: true,
            lang: 'pt',
          },
        ),
      },
    }),
  ],
  providers: [
    {
      provide: DRIZZLE,
      useFactory: (config: ConfigType<typeof dbConfig>) => {
        const pool = new Pool({
          connectionString: config.url,
        });
        return drizzle(pool, { schema });
      },
      inject: [dbConfig.KEY],
    },
  ],
  controllers: [UserController],
})
export class NodeModule {}
