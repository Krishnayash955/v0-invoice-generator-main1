import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres'; // This is Vercel's recommended way to query
import * as schema from './schema';     // Import all your table schemas

// The Vercel Postgres SDK (sql object) handles connection pooling automatically for serverless functions.
// You pass it to Drizzle.
export const db = drizzle(sql, { schema });

// Now you can use `db.query.invoices.findMany()` or `db.insert(schema.invoices).values(...)`
// in your Server Actions or API routes.