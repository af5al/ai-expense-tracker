import * as SQLite from 'expo-sqlite';
import { SCHEMA_TABLES, SCHEMA_INDEXES } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Open or retrieve the open asynchronous instance of the SQLite database
 */
export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('expenses.db');
  }
  return dbInstance;
}

/**
 * Initialize the database schema and indexes asynchronously
 */
export async function initDatabase(): Promise<void> {
  const db = await getDB();
  try {
    // Execute table creations sequentially
    for (const tableSql of SCHEMA_TABLES) {
      await db.execAsync(tableSql);
    }
    // Execute index creations sequentially
    for (const indexSql of SCHEMA_INDEXES) {
      await db.execAsync(indexSql);
    }
    console.log('[Database] Async initialization completed successfully');
  } catch (error) {
    console.error('[Database] Async initialization error:', error);
    throw error;
  }
}

/**
 * Helper to run a SELECT query and return all matching rows asynchronously.
 */
export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDB();
  return db.getAllAsync<T>(sql, params);
}

/**
 * Helper to run a SELECT query that returns at most one row asynchronously.
 */
export async function queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const db = await getDB();
  return db.getFirstAsync<T>(sql, params);
}

/**
 * Helper to execute an INSERT, UPDATE, or DELETE query asynchronously.
 */
export async function execute(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
  const db = await getDB();
  return db.runAsync(sql, params);
}

/**
 * Reset database - Wipe all tables asynchronously (Required for Privacy Compliance)
 */
export async function wipeDatabase(): Promise<void> {
  const db = await getDB();
  try {
    await db.execAsync('DELETE FROM expenses;');
    await db.execAsync('DELETE FROM budgets;');
    await db.execAsync('DELETE FROM budget_categories;');
    await db.execAsync('DELETE FROM savings_goals;');
    await db.execAsync('DELETE FROM recurring_expenses;');
    await db.execAsync('DELETE FROM settings;');
    console.log('[Database] All user data has been wiped.');
  } catch (error) {
    console.error('[Database] Failed to wipe database:', error);
    throw error;
  }
}
