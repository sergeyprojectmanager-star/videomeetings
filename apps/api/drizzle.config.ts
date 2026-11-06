import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Nest, so load the .env file ourselves.
for (const path of ['.env', '../../.env']) {
  try {
    process.loadEnvFile(path);
    break;
  } catch {
    // try the next location
  }
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
