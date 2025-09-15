import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import schema, { type Schema } from './schema';
import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { Pool } from 'pg';
import { dbConfig } from 'src/config/database';
import z from 'zod';

export const DRIZZLE = Symbol('drizzle');
export type DrizzleDatabase = NodePgDatabase<Schema>;
const validator = {
  validate: (value: unknown) => {
    const schema = z.object({
      DATABASE_URL: z.url(),
    });
    const validated = schema.safeParse(value);
    return { value: validated.data, error: validated.error };
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
