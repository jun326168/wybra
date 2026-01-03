import { Pool, neonConfig } from '@neondatabase/serverless';

// Configure Neon for WebSocket connections
neonConfig.fetchConnectionCache = true;

// Create a connection pool
let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({ connectionString: databaseUrl });
  }
  
  return pool;
}

// Helper function to query the database
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper function to query a single row
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

