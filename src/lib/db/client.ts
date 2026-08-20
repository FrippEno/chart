// Database Client Wrapper for chart-tracker
import type { D1Database } from './types';

/**
 * Get D1 database instance from Astro context
 * Usage in Astro pages:
 * const db = getDB(Astro.locals.runtime.env);
 */
export function getDB(env: any): D1Database {
  if (!env?.DB) {
    throw new Error('D1 database not available. Make sure DB binding is configured in wrangler.toml');
  }
  return env.DB;
}

/**
 * Helper to safely execute queries with error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(errorMessage);
  }
}
