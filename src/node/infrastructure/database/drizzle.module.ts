import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import schema, { type Schema } from './schema';
import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { Pool } from 'pg';
import { dbConfig } from 'src/config/database';
import * as v from 'valibot';

export const DRIZZLE = Symbol('drizzle');
export type DrizzleDatabase = NodePgDatabase<Schema>;
const validator = {
  validate: (value: unknown) => {
    const schema = v.object({
      DATABASE_URL: v.pipe(v.string(), v.url()),
    });
    const validated = v.safeParse(schema, value, {
      abortEarly: true,
    });
    return { value: validated.output, error: validated.issues };
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      load: [dbConfig],
      validationSchema: validator,
    }),
  ],
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async (config: ConfigType<typeof dbConfig>) => {
        const pool = new Pool({
          connectionString: config.url,
        });
        await pool.connect();
        return drizzle(pool, { schema }) as DrizzleDatabase;
      },
      inject: [dbConfig.KEY],
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
