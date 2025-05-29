import { drizzle } from 'drizzle-orm/vercel-postgres';
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { createPool } from '@vercel/postgres'; // For running migrations, a direct pool is often better
import *as dotenv from 'dotenv';

// Load .env.local for local migration runs
dotenv.config({ path: '.env.local' });

async function runMigrations() {
  const dbConnectionString = process.env.POSTGRES_URL;

  if (!dbConnectionString) {
    console.error('🔴 POSTGRES_URL environment variable is not set. Cannot run migrations.');
    process.exit(1);
  }

  console.log('🟠 Connecting to database for migrations...');
  // For migrations, it's often recommended to use a direct pool connection
  // rather than the Vercel SDK's `sql` template, which is optimized for serverless function queries.
  const migrationPool = createPool({ connectionString: dbConnectionString });
  const db = drizzle(migrationPool); // No schema needed here for the migrator itself

  console.log('⏳ Running migrations...');
  const startTime = Date.now();

  try {
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    const endTime = Date.now();
    console.log('✅ Migrations completed successfully in', (endTime - startTime) / 1000, 's');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1); // Exit with error code to fail CI/CD if necessary
  } finally {
    // IMPORTANT: Close the connection pool after migrations are done
    // to allow the script to exit, especially in CI environments.
    await migrationPool.end();
    console.log('🔵 Migration pool closed.');
  }
}

runMigrations();
