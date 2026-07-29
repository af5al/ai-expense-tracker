import * as SQLite from 'expo-sqlite';
import { SCHEMA_TABLES, SCHEMA_INDEXES } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Open or retrieve the open instance of the SQLite database
 */
export function getDB(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('expenses.db');
  }
  return dbInstance;
}

/**
 * Initialize the database schema and indexes in a synchronous transaction
 */
export function initDatabase(): void {
  const db = getDB();
  try {
    db.withTransactionSync(() => {
      // Create tables
      for (const tableSql of SCHEMA_TABLES) {
        db.execSync(tableSql);
      }
      // Create indexes
      for (const indexSql of SCHEMA_INDEXES) {
        db.execSync(indexSql);
      }
    });
    console.log('[Database] Initialization completed successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}

/**
 * Helper to run a SELECT query and return all matching rows.
 */
export function queryAll<T>(sql: string, params: any[] = []): T[] {
  const db = getDB();
  return db.getAllSync<T>(sql, params);
}

/**
 * Helper to run a SELECT query that returns at most one row.
 */
export function queryOne<T>(sql: string, params: any[] = []): T | null {
  const db = getDB();
  return db.getFirstSync<T>(sql, params);
}

/**
 * Helper to execute an INSERT, UPDATE, or DELETE query.
 */
export function execute(sql: string, params: any[] = []): SQLite.SQLiteRunResult {
  const db = getDB();
  return db.runSync(sql, params);
}

/**
 * Reset database - Wipe all tables (Required for Privacy Compliance)
 */
export function wipeDatabase(): void {
  const db = getDB();
  try {
    db.withTransactionSync(() => {
      db.execSync('DELETE FROM expenses;');
      db.execSync('DELETE FROM budgets;');
      db.execSync('DELETE FROM budget_categories;');
      db.execSync('DELETE FROM savings_goals;');
      db.execSync('DELETE FROM recurring_expenses;');
      db.execSync('DELETE FROM settings;');
    });
    console.log('[Database] All user data has been wiped.');
  } catch (error) {
    console.error('[Database] Failed to wipe database:', error);
    throw error;
  }
}
