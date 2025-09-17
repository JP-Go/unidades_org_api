import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import schema, { type Schema } from './schema';
import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { Pool } from 'pg';
import { dbConfig } from 'src/config/database';
import z from 'zod';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export const DRIZZLE = Symbol('drizzle');
export type DrizzleDatabase = NodePgDatabase<Schema>;

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile:
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'production',
      envFilePath: ['.env'],
      load: [dbConfig],
      validate(config) {
        if (process.env.NODE_ENV !== 'test') {
          const schema = z.object({
            DATABASE_URL: z.url(),
          });
          return schema.parse(config);
        }
        return config;
      },
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
        const db = drizzle(pool, { schema });
        await migrate(db, {
          migrationsFolder: './src/migrations',
        });
        return db;
      },
      inject: [dbConfig.KEY],
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
