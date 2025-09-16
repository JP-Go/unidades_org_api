import { defineConfig } from 'drizzle-kit';
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  void (async () => {
    await import('dotenv/config');
  })();
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/**/infrastructure/database/**/*.model.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
