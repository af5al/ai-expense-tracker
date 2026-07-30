import { execute, queryAll, queryOne } from './db';
import { RecurringExpense } from '@/types';

/**
 * Maps database row to standard TypeScript typed object.
 */
function mapRow(row: any): RecurringExpense {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    category: row.category,
    frequency: row.frequency,
    nextExpectedDate: row.nextExpectedDate,
    active: row.active === 1,
  };
}

/**
 * Fetch all recurring commitments asynchronously.
 */
export async function getRecurringExpenses(onlyActive: boolean = false): Promise<RecurringExpense[]> {
  const sql = onlyActive 
    ? 'SELECT * FROM recurring_expenses WHERE active = 1;' 
    : 'SELECT * FROM recurring_expenses;';
  
  const rows = await queryAll<any>(sql);
  return rows.map(mapRow);
}

/**
 * Insert a new recurring expense commitment asynchronously.
 */
export async function insertRecurringExpense(rec: RecurringExpense): Promise<void> {
  const sql = `
    INSERT OR REPLACE INTO recurring_expenses (id, description, amount, category, frequency, nextExpectedDate, active)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  await execute(sql, [
    rec.id,
    rec.description,
    rec.amount,
    rec.category,
    rec.frequency,
    rec.nextExpectedDate,
    rec.active ? 1 : 0,
  ]);
}

/**
 * Confirm / Activate a recurring subscription asynchronously.
 */
export async function activateRecurringExpense(id: string): Promise<void> {
  await execute('UPDATE recurring_expenses SET active = 1 WHERE id = ?;', [id]);
}

/**
 * Delete recurring expense asynchronously.
 */
export async function deleteRecurringExpense(id: string): Promise<void> {
  await execute('DELETE FROM recurring_expenses WHERE id = ?;', [id]);
}

/**
 * Update next expected billing cycle date asynchronously.
 */
export async function updateRecurringNextDate(id: string, nextDate: string): Promise<void> {
  await execute('UPDATE recurring_expenses SET nextExpectedDate = ? WHERE id = ?;', [nextDate, id]);
}
