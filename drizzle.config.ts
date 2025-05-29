// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local for local drizzle-kit operations
dotenv.config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set. Check your .env.local file.');
}

export default {
  schema: './app/db/schema.ts',       // Path to your Drizzle schema file
  out: './drizzle/migrations',      // Directory where migration files will be generated
  dialect: 'postgresql',            // Specify the database dialect
  dbCredentials: {
    url: process.env.POSTGRES_URL,  // Connection string from Vercel (or your local .env.local)
  },
  // Optional: driver: 'pg', // Usually inferred, but can be explicit
  verbose: true, // For more detailed output from drizzle-kit
  strict: true,  // For stricter schema checking
} satisfies Config;