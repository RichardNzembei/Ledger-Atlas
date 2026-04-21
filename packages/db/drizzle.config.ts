import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? process.env['DB_URL'] ?? '',
  },
});
