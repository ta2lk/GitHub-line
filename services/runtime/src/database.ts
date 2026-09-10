/**
 * Ephemeral Database Manager
 * Detects database requirements from repository manifests and prepares
 * sandboxed ephemeral database environment variables (SQLite, Postgres, Redis).
 */

export interface DatabaseRequirement {
  type: 'sqlite' | 'postgres' | 'redis' | 'mysql';
  connectionEnvVar: string;
  connectionString: string;
}

export class EphemeralDatabaseManager {
  public detect(fileContents: string[]): DatabaseRequirement | null {
    const combined = fileContents.join(' ').toLowerCase();

    if (combined.includes('redis')) {
      return {
        type: 'redis',
        connectionEnvVar: 'REDIS_URL',
        connectionString: 'redis://127.0.0.1:6379'
      };
    }

    if (combined.includes('pg') || combined.includes('psycopg') || combined.includes('postgres')) {
      return {
        type: 'postgres',
        connectionEnvVar: 'DATABASE_URL',
        connectionString: 'postgres://git2live:ephemeral@127.0.0.1:5432/sandbox'
      };
    }

    if (combined.includes('sqlite') || combined.includes('better-sqlite3')) {
      return {
        type: 'sqlite',
        connectionEnvVar: 'DATABASE_URL',
        connectionString: 'sqlite:///tmp/sandbox.db'
      };
    }

    return null;
  }
}

export const ephemeralDbManager = new EphemeralDatabaseManager();
